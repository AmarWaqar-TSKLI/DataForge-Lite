import numpy as np

# Helper to make all values JSON serializable
def make_json_safe(obj):
	import numpy as np
	if isinstance(obj, (np.integer, np.floating)):
		v = obj.item()
		if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
			return None
		return v
	if isinstance(obj, float):
		if obj != obj or obj == float('inf') or obj == float('-inf'):
			return None
		return obj
	if isinstance(obj, np.ndarray):
		return [make_json_safe(x) for x in obj.tolist()]
	return obj
# viz_handler.py
"""
Prepares chart-ready JSON from DataFrame and chart_spec for frontend rendering.
"""
import pandas as pd

def prepare_chart_data(df: pd.DataFrame, chart_spec: dict) -> dict:
	"""
	Given a DataFrame and chart_spec, return chart-ready JSON for frontend.
	Supports: bar, line, pie, scatter, histogram.
	chart_spec: {type, x, y, agg, top_n}
	"""
	chart_type = chart_spec.get("type", "bar")
	x = chart_spec.get("x")
	y = chart_spec.get("y")
	agg = chart_spec.get("agg", "sum")
	top_n = chart_spec.get("top_n") or chart_spec.get("limit") or 10
	result = {"type": chart_type, "labels": [], "datasets": [], "meta": {"x": x, "y": y, "agg": agg}}

	if chart_type in ["bar", "line", "histogram"]:
		if x and y and agg != "none":
			grouped = df.groupby(x)[y]
			if agg == "sum":
				data = grouped.sum()
			elif agg == "mean":
				data = grouped.mean()
			elif agg == "count":
				data = grouped.count()
			elif agg == "min":
				data = grouped.min()
			elif agg == "max":
				data = grouped.max()
			else:
				data = grouped.sum()
			data = data.sort_values(ascending=False)
			if top_n:
				data = data.head(int(top_n))
			# Backend validation: if aggregation result is empty, raise error
			if data.empty:
				raise ValueError(f"No data to plot. Check if X is categorical/discrete and Y is numeric. Current X: {x}, Y: {y}.")
			# Convert numpy types to Python native types for JSON serialization
			labels = [str(idx) if not isinstance(idx, str) else idx for idx in data.index]
			values = [v.item() if hasattr(v, 'item') else v for v in data.values]
			result["labels"] = labels
			result["datasets"] = [{"label": y, "data": values}]
		elif x and not y:
			# Just value counts of x
			data = df[x].value_counts().head(int(top_n))
			labels = [str(idx) if not isinstance(idx, str) else idx for idx in data.index]
			values = [v.item() if hasattr(v, 'item') else v for v in data.values]
			result["labels"] = labels
			result["datasets"] = [{"label": x, "data": values}]
		elif y and not x:
			# Just value counts of y
			data = df[y].value_counts().head(int(top_n))
			labels = [str(idx) if not isinstance(idx, str) else idx for idx in data.index]
			values = [v.item() if hasattr(v, 'item') else v for v in data.values]
			result["labels"] = labels
			result["datasets"] = [{"label": y, "data": values}]
		elif chart_type == "histogram" and x:
			# Histogram of x
			values = df[x].dropna().values
			bins = chart_spec.get("bins", 10)
			counts, bin_edges = np.histogram(values, bins=bins)
			labels = [f"{round(make_json_safe(bin_edges[i]),2)}-{round(make_json_safe(bin_edges[i+1]),2)}" for i in range(len(bin_edges)-1)]
			counts_py = [make_json_safe(c) for c in counts]
			result["labels"] = labels
			result["datasets"] = [{"label": x, "data": counts_py}]
	elif chart_type == "pie":
		if x:
			data = df[x].value_counts().head(int(top_n))
			labels = [str(idx) if not isinstance(idx, str) else idx for idx in data.index]
			values = [v.item() if hasattr(v, 'item') else v for v in data.values]
			result["labels"] = labels
			result["datasets"] = [{"label": x, "data": values}]
	elif chart_type == "scatter":
		if x and y:
			points = df[[x, y]].dropna().values.tolist()
			# Convert all points to Python native types
			points_py = [[v.item() if hasattr(v, 'item') else v for v in pair] for pair in points]
			result["labels"] = []
			result["datasets"] = [{"label": f"{x} vs {y}", "data": points_py}]
	else:
		raise ValueError(f"Unsupported chart type: {chart_type}")
	return result
