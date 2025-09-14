# ai_handler.py
"""
Handles OpenRouter API calls and prompt formatting for AI queries, visualization, and transform suggestions.
"""
import os
import requests

import json

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek/deepseek-r1:free")

def extract_json_or_text(content):
	"""
	Try to extract JSON from LLM response, fallback to text.
	"""
	# Try to find JSON in code block
	import re
	match = re.search(r'```(?:json)?\s*([\s\S]+?)\s*```', content)
	if match:
		content = match.group(1)
	# Try to parse as JSON
	try:
		return json.loads(content)
	except Exception:
		# Try to find first {...} block
		match = re.search(r'({[\s\S]+})', content)
		if match:
			try:
				return json.loads(match.group(1))
			except Exception:
				pass
	# Fallback: return as text
	return {"insight": content.strip(), "confidence": "low"}

def ask_openrouter(prompt_text: str, max_tokens: int = 1000):
	"""
	Call OpenRouter API with prompt_text, return parsed response (JSON or text).
	Handles empty/truncated responses and increases max_tokens for better results.
	"""
	if not OPENROUTER_API_KEY:
		return {"insight": "AI API key is not set in backend environment.", "confidence": "low"}
	payload = {
		"model": DEEPSEEK_MODEL,
		"messages": [
			{"role": "user", "content": prompt_text}
		],
		"temperature": 0.1,
		"max_tokens": max(max_tokens, 256)  # Ensure at least 256 tokens
	}
	headers = {
		"Authorization": f"Bearer {OPENROUTER_API_KEY}",
		"Content-Type": "application/json"
	}
	try:
		r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
		r.raise_for_status()
		result = r.json()
		content = result['choices'][0]['message'].get('content', '')
		if not content or content.strip() == '':
			return {"insight": "AI model returned an empty response. Please try again or use a different model.", "confidence": "low"}
		# Check for truncated response
		finish_reason = result['choices'][0].get('finish_reason', '')
		if finish_reason == 'length':
			return {"insight": "AI model response was cut off. Please rephrase your question or use a smaller dataset.", "confidence": "low"}
		return extract_json_or_text(content)
	except Exception as e:
		return {"insight": f"AI request failed: {e}", "confidence": "low"}

def ask_ai_for_query(dataset_snapshot: str, columns: list, stats: str, question: str) -> dict:
	"""
	Format and send a query prompt to OpenRouter, return AI response.
	"""
	system = "You are a concise data analyst. Always respond in JSON only."
	user = (
		f"Here is a dataset snapshot (first rows): {dataset_snapshot}\n"
		f"Columns: {columns}\nStats: {stats}\n"
		f"Question: \"{question}\"\n"
		"Please reply exactly with JSON:\n"
		"{\n  \"insight\": \"<short explanation — 1-3 sentences>\",\n  \"confidence\": \"low|medium|high\",\n  \"chart\": { \"type\": \"bar|line|pie|scatter|histogram\", \"x\": \"column\", \"y\":\"column\", \"agg\":\"sum|mean|count|none\", \"top_n\":10 }  // chart optional\n}"
	)
	prompt = f"System: {system}\nUser: {user}"
	return ask_openrouter(prompt)

def ask_ai_for_visualization(dataset_snapshot: str, ask_text: str) -> dict:
	"""
	Format and send a visualization prompt to OpenRouter, return chart spec.
	"""
	system = "You are a visualization advisor that returns JSON specifications only."
	user = (
		f"Provide a chart spec for: \"{ask_text}\" given dataset snapshot: {dataset_snapshot}\n"
		"Return JSON: { \"type\":\"bar\", \"x\":\"col\", \"y\":\"col\", \"agg\":\"sum\", \"top_n\":10 }"
	)
	prompt = f"System: {system}\nUser: {user}"
	return ask_openrouter(prompt)

def ask_ai_for_transform(dataset_snapshot: str, question: str) -> dict:
	"""
	Format and send a transform suggestion prompt to OpenRouter, return ops list.
	"""
	system = "You are a data cleaning assistant. Reply in JSON."
	user = (
		f"Dataset snapshot: {dataset_snapshot}\n"
		f"Question: \"{question}\"\n"
		"Reply: {\"ops\":[ {\"op\":\"fillna\",\"col\":\"A\",\"method\":\"median\"}, {\"op\":\"drop_outliers\",\"col\":\"B\",\"method\":\"iqr\",\"threshold\":1.5} ]}"
	)
	prompt = f"System: {system}\nUser: {user}"
	return ask_openrouter(prompt)
