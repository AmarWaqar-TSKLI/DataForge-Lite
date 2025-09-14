# main.py
"""
FastAPI entrypoint for DataForge Lite backend.
Implements upload, preview, clean, stats, query, visualize, download endpoints.
"""
import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.background import BackgroundTasks
import uvicorn

# Import utility modules
from utils import file_utils, data_handler, ai_handler, viz_handler
import pandas as pd
def save_stats_files(stats: dict, dataset_id: str):
	"""
	Save summary stats in CSV, XLSX, and JSON formats for download.
	Handles nested dicts/lists and non-serializable values.
	"""
	import json
	stats_dir = os.path.join(os.path.dirname(__file__), 'utils', 'stats_exports')
	if not os.path.exists(stats_dir):
		os.makedirs(stats_dir)
	# Save as JSON
	json_path = os.path.join(stats_dir, f'stats_{dataset_id}.json')
	with open(json_path, 'w', encoding='utf-8') as f:
		json.dump(stats, f, indent=2, default=str)

	def flatten(d, parent_key="", sep="."):
		items = {}
		if isinstance(d, dict):
			for k, v in d.items():
				new_key = f"{parent_key}{sep}{k}" if parent_key else k
				if isinstance(v, dict):
					items.update(flatten(v, new_key, sep=sep))
				elif isinstance(v, list):
					for i, item in enumerate(v):
						items.update(flatten(item, f"{new_key}[{i}]", sep=sep))
				else:
					items[new_key] = v
		else:
			items[parent_key] = d
		return items

	flat = flatten(stats)
	# Save as CSV
	csv_path = os.path.join(stats_dir, f'stats_{dataset_id}.csv')
	pd.DataFrame(list(flat.items()), columns=["stat", "value"]).to_csv(csv_path, index=False)
	# Save as XLSX
	xlsx_path = os.path.join(stats_dir, f'stats_{dataset_id}.xlsx')
	pd.DataFrame(list(flat.items()), columns=["stat", "value"]).to_excel(xlsx_path, index=False, engine='openpyxl')
	return {"csv": csv_path, "xlsx": xlsx_path, "json": json_path}

app = FastAPI()

# CORS setup (allow localhost:5173 for Vite dev)
origins = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"*"  # TODO: restrict in production
]
app.add_middleware(
	CORSMiddleware,
	allow_origins=origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# File upload size limit (20 MB)
MAX_UPLOAD_SIZE = 20 * 1024 * 1024

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
	"""
	Upload CSV/XLSX/JSON file, save, return dataset_id, preview, columns.
	"""
	if file is None or file.filename == "":
		raise HTTPException(status_code=400, detail="No file uploaded.")
	ext = os.path.splitext(file.filename)[-1].lower()
	if ext not in ['.csv', '.xlsx', '.json']:
		raise HTTPException(status_code=400, detail="Unsupported file type.")
	file.file.seek(0, 2)
	size = file.file.tell()
	file.file.seek(0)
	if size > MAX_UPLOAD_SIZE:
		raise HTTPException(status_code=413, detail="File too large (max 20MB).")
	try:
		dataset_id = file_utils.save_upload(file)
		df = file_utils.load_dataframe(dataset_id)
		# Replace out-of-bounds float values in preview
		preview = df.head(20).replace([float('inf'), float('-inf')], None).where(pd.notnull(df.head(20)), None).to_dict(orient="records")
		columns = list(df.columns)
		return JSONResponse(content={"dataset_id": dataset_id, "preview": preview, "columns": columns})
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

@app.get("/preview/{dataset_id}")
async def preview(dataset_id: str):
	"""
	Return first 20 rows of dataset as preview.
	"""
	try:
		df = file_utils.load_dataframe(dataset_id)
		preview = df.head(20).to_dict(orient="records")
		columns = list(df.columns)
		return JSONResponse(content={"dataset_id": dataset_id, "preview": preview, "columns": columns})
	except Exception as e:
		raise HTTPException(status_code=404, detail=str(e))

@app.post("/clean/{dataset_id}")
async def clean(dataset_id: str, request: Request):
	"""
	Clean dataset (auto or with strategy), return preview and stats.
	"""
	try:
		body = await request.json()
		strategy = body.get("strategy", None)
		df = file_utils.load_dataframe(dataset_id)
		# Drop columns before cleaning/stats if specified
		drop_cols = strategy.get("drop_columns", [])
		if drop_cols:
			df = df.drop(columns=drop_cols, errors='ignore')
		cleaned_df = data_handler.auto_clean(df, strategy)
		# Save cleaned data in all formats for download
		file_utils.save_dataframe(cleaned_df, dataset_id, format="csv")
		try:
			file_utils.save_dataframe(cleaned_df, dataset_id, format="xlsx")
		except Exception:
			pass
		try:
			file_utils.save_dataframe(cleaned_df, dataset_id, format="json")
		except Exception:
			pass
		preview = data_handler.get_preview(cleaned_df, 20)
		# Replace out-of-bounds float values in preview
		import pandas as pd
		preview = pd.DataFrame(preview).replace([float('inf'), float('-inf')], None).where(pd.notnull(pd.DataFrame(preview)), None).to_dict(orient="records") if preview else []
		stats = data_handler.get_summary_stats(cleaned_df)
		save_stats_files(stats, dataset_id)
		return {"preview": preview, "stats": stats, "cleaned": True}
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats/{dataset_id}")
async def stats(dataset_id: str):
	"""
	Return summary statistics for dataset.
	"""
	try:
		df = file_utils.load_dataframe(dataset_id)
		stats = data_handler.get_summary_stats(df)
		save_stats_files(stats, dataset_id)
		return {"dataset_id": dataset_id, "stats": stats}
	except Exception as e:
		raise HTTPException(status_code=404, detail=str(e))
# Download summary stats in any format
@app.get("/download_stats/{dataset_id}")
async def download_stats(dataset_id: str, format: str = "csv"):
	"""
	Download summary stats as CSV/XLSX/JSON.
	"""
	try:
		stats_dir = os.path.join(os.path.dirname(__file__), 'utils', 'stats_exports')
		ext = format.lower()
		if ext not in ["csv", "xlsx", "json"]:
			raise HTTPException(status_code=400, detail="Invalid format.")
		file_path = os.path.join(stats_dir, f'stats_{dataset_id}.{ext}')
		if not os.path.exists(file_path):
			# Try to generate if missing
			df = file_utils.load_dataframe(dataset_id)
			stats = data_handler.get_summary_stats(df)
			save_stats_files(stats, dataset_id)
		if not os.path.exists(file_path):
			raise HTTPException(status_code=404, detail="Stats file not found.")
		filename = os.path.basename(file_path)
		return FileResponse(file_path, media_type="application/octet-stream", filename=filename)
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query(request: Request):
	"""
	Accept dataset_id + question, call AI, return insight + chart suggestion.
	"""
	try:
		body = await request.json()
		dataset_id = body.get("dataset_id")
		question = body.get("question")
		if not dataset_id or not question:
			raise HTTPException(status_code=400, detail="dataset_id and question required.")
		df = file_utils.load_dataframe(dataset_id)
		snapshot = df.head(30).to_json(orient='records')
		columns = list(df.columns)
		stats = df.describe(include='all').to_string()
		ai_response = ai_handler.ask_ai_for_query(snapshot, columns, stats, question)
		# If AI response is missing, empty, or not useful, return a clear error
		if not ai_response or not ai_response.get('insight') or not ai_response['insight'].strip():
			raise HTTPException(status_code=500, detail="AI model returned an empty or invalid response. Please try again or use a different model.")
		return ai_response
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

@app.post("/visualize")
async def visualize(request: Request):
	"""
	Accept dataset_id + chart_spec, return chart-ready JSON.
	"""
	try:
		body = await request.json()
		dataset_id = body.get("dataset_id")
		chart_spec = body.get("chart_spec")
		if not dataset_id or not chart_spec:
			raise HTTPException(status_code=400, detail="dataset_id and chart_spec required.")
		df = file_utils.load_dataframe(dataset_id)
		chart_json = viz_handler.prepare_chart_data(df, chart_spec)
		return {"chart": chart_json}
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{dataset_id}")
async def download(dataset_id: str, format: str = "csv"):
	"""
	Download cleaned file as CSV/XLSX/JSON.
	"""
	try:
		# Prefer cleaned file, fallback to original
		cleaned_path = None
		for ext in [".csv", ".xlsx", ".json"]:
			path = os.path.join(file_utils.UPLOAD_DIR, f"cleaned_{dataset_id}{ext}")
			if os.path.exists(path) and (format in path):
				cleaned_path = path
				break
		if not cleaned_path:
			# fallback to original
			for ext in [".csv", ".xlsx", ".json"]:
				path = os.path.join(file_utils.UPLOAD_DIR, f"{dataset_id}{ext}")
				if os.path.exists(path) and (format in path):
					cleaned_path = path
					break
		if not cleaned_path:
			raise HTTPException(status_code=404, detail="File not found.")
		filename = os.path.basename(cleaned_path)
		return FileResponse(cleaned_path, media_type="application/octet-stream", filename=filename)
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
	uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
