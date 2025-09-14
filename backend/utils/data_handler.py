# Helper to make all values JSON serializable and compatible with JSON (no inf/nan)
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
import numpy as np

# Helper to make all values JSON serializable
def make_json_safe(obj):
	if isinstance(obj, (np.integer, np.floating)):
		return obj.item()
	if isinstance(obj, np.ndarray):
		return obj.tolist()
	return obj
# data_handler.py
"""
Core data wrangling: cleaning, imputations, duplicate removal, type coercion, summary stats.
"""
import pandas as pd

def auto_clean(df: pd.DataFrame, strategy: dict = None) -> pd.DataFrame:
	"""
	Automatically clean DataFrame using strategy (drop duplicates, fillna, etc).
	Returns cleaned DataFrame.
	"""
	if strategy is None:
		strategy = {"numeric": "median", "categorical": "mode", "drop_duplicates": True}
	df_clean = df.copy()
	# Drop columns if specified
	drop_cols = strategy.get("drop_columns", [])
	if drop_cols:
		df_clean = df_clean.drop(columns=[c for c in drop_cols if c in df_clean.columns], errors='ignore')
	# Drop duplicates
	if strategy.get("drop_duplicates", True):
		df_clean = df_clean.drop_duplicates()
	# Fill missing values
	for col in df_clean.columns:
		if df_clean[col].dtype.kind in 'biufc':  # numeric
			if strategy.get("numeric", "median") == "mean":
				fill_value = df_clean[col].mean()
			else:
				fill_value = df_clean[col].median()
			df_clean[col] = df_clean[col].fillna(fill_value)
		else:  # categorical
			if strategy.get("categorical", "mode") == "mode":
				fill_value = df_clean[col].mode().iloc[0] if not df_clean[col].mode().empty else "<missing>"
			else:
				fill_value = strategy.get("categorical_value", "<missing>")
			df_clean[col] = df_clean[col].fillna(fill_value)
	return df_clean

def get_preview(df: pd.DataFrame, n: int = 20) -> list:
	"""
	Return first n rows as list of dicts for preview.
	"""
	return df.head(n).to_dict(orient="records")

def get_summary_stats(df: pd.DataFrame) -> dict:
	"""
	Return summary statistics (describe, value_counts, nulls, corr).
	"""
	stats = {}
	# Numeric summary
	describe = df.describe(include='all').fillna("").to_dict()
	stats["describe"] = {k: {kk: make_json_safe(vv) for kk, vv in v.items()} for k, v in describe.items()}
	# Null counts
	nulls = df.isnull().sum().to_dict()
	stats["nulls"] = {k: make_json_safe(v) for k, v in nulls.items()}
	# Value counts for categoricals
	value_counts = {}
	for col in df.columns:
		if df[col].dtype == object or df[col].dtype.name == 'category':
			vc = df[col].value_counts(dropna=False).head(10).to_dict()
			value_counts[col] = {k: make_json_safe(v) for k, v in vc.items()}
	stats["value_counts"] = value_counts
	# Correlation matrix (only if >1 numeric col)
	num_cols = df.select_dtypes(include=['number']).columns
	if len(num_cols) > 1:
		corr = df[num_cols].corr().to_dict()
		stats["correlation"] = {k: {kk: make_json_safe(vv) for kk, vv in v.items()} for k, v in corr.items()}
	else:
		stats["correlation"] = {}
	return stats
