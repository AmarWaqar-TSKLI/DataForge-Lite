# file_utils.py
"""
Handles file upload, loading, saving, and deletion for datasets.
"""
import os
import uuid
import pandas as pd

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')

def save_upload(upload_file) -> str:
	"""
	Save uploaded file to uploads/ using a generated dataset_id.
	Returns dataset_id (str).
	"""
	if not os.path.exists(UPLOAD_DIR):
		os.makedirs(UPLOAD_DIR)
	ext = os.path.splitext(upload_file.filename)[-1].lower()
	if ext not in ['.csv', '.xlsx', '.json']:
		raise ValueError("Unsupported file type. Only .csv, .xlsx, .json allowed.")
	dataset_id = str(uuid.uuid4())
	dest_path = os.path.join(UPLOAD_DIR, f"{dataset_id}{ext}")
	with open(dest_path, "wb") as f:
		content = upload_file.file.read()
		f.write(content)
	return dataset_id

def load_dataframe(dataset_id: str) -> pd.DataFrame:
	"""
	Load dataset into pandas DataFrame by dataset_id.
	Handles csv/xlsx/json.
	"""
	# Try all supported extensions
	for ext in ['.csv', '.xlsx', '.json']:
		path = os.path.join(UPLOAD_DIR, f"{dataset_id}{ext}")
		if os.path.exists(path):
			try:
				if ext == '.csv':
					try:
						df = pd.read_csv(path, encoding='utf-8', engine='python')
					except Exception:
						df = pd.read_csv(path, encoding='latin1', engine='python')
				elif ext == '.xlsx':
					df = pd.read_excel(path, engine='openpyxl')
				elif ext == '.json':
					df = pd.read_json(path)
				# Optionally normalize column names
				df.columns = [str(c).strip().lower() for c in df.columns]
				return df
			except Exception as e:
				raise ValueError(f"Failed to load file: {e}")
	raise FileNotFoundError(f"Dataset {dataset_id} not found.")

def save_dataframe(df: pd.DataFrame, dataset_id: str, format: str = "csv") -> str:
	"""
	Save DataFrame to disk in specified format (csv/xlsx).
	Returns file path.
	"""
	if not os.path.exists(UPLOAD_DIR):
		os.makedirs(UPLOAD_DIR)
	if format == "csv":
		path = os.path.join(UPLOAD_DIR, f"cleaned_{dataset_id}.csv")
		df.to_csv(path, index=False)
	elif format == "xlsx":
		path = os.path.join(UPLOAD_DIR, f"cleaned_{dataset_id}.xlsx")
		df.to_excel(path, index=False, engine='openpyxl')
	elif format == "json":
		path = os.path.join(UPLOAD_DIR, f"cleaned_{dataset_id}.json")
		df.to_json(path, orient='records')
	else:
		raise ValueError("Unsupported format. Use csv, xlsx, or json.")
	return path

def delete_dataset(dataset_id: str):
	"""
	Delete dataset files for cleanup (optional).
	"""
	removed = False
	for prefix in ["", "cleaned_"]:
		for ext in ['.csv', '.xlsx', '.json']:
			path = os.path.join(UPLOAD_DIR, f"{prefix}{dataset_id}{ext}")
			if os.path.exists(path):
				os.remove(path)
				removed = True
	return removed
