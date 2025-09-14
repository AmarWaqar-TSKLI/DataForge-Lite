import React, { useState } from 'react';
import API from '../api';
import { useData } from '../context.jsx';

const AIChat = ({ onChartSuggestion }) => {
	const { datasetId } = useData();
	const [question, setQuestion] = useState('');
	const [answer, setAnswer] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleSend = async () => {
			setError(null);
			setLoading(true);
			setAnswer(null);
			try {
				const res = await API.post('/query', { dataset_id: datasetId, question });
				// Show any insight message, even if it's an error or empty
				if (res.data?.insight && typeof res.data.insight === 'string') {
					if (
						res.data.insight.startsWith('AI request failed:') ||
						res.data.insight.toLowerCase().includes('api key') ||
						res.data.insight.toLowerCase().includes('timeout') ||
						res.data.insight.toLowerCase().includes('too large') ||
						res.data.insight.toLowerCase().includes('empty') ||
						res.data.insight.toLowerCase().includes('invalid')
					) {
						setError(res.data.insight.trim());
					} else if (res.data.insight.trim() === '') {
						setError('AI model returned an empty response. Please try again or use a different model.');
					} else {
						setAnswer(res.data || res);
					}
				} else {
					setError('AI query failed.');
				}
			} catch (e) {
				if (e?.response?.data?.detail) {
					setError(e.response.data.detail);
				} else if (e?.message && e.message.includes('Network Error')) {
					setError('Network error: Unable to reach AI service.');
				} else {
					setError('AI query failed.');
				}
			} finally {
				setLoading(false);
			}
		};

	return (
		<div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4">
			<h3 className="text-lg font-bold text-primary mb-2">Ask AI About Your Data</h3>
			<textarea
				className="w-full bg-background border border-border rounded p-2 text-text min-h-[60px]"
				placeholder="Type your question (e.g. What is the average revenue in 2023?)"
				value={question}
				onChange={e => setQuestion(e.target.value)}
				disabled={loading || !datasetId}
			/>
							<button
								className="px-4 py-2 rounded-xl bg-primary text-white font-semibold shadow-button hover:bg-accent hover:shadow-lg transition-all w-fit focus:outline-none focus:ring-2 focus:ring-primary/60"
								onClick={handleSend}
								disabled={loading || !question || !datasetId}
							>
								{loading ? 'Asking...' : 'Send'}
							</button>
			{error && <div className="text-error mt-2">{error}</div>}
			{answer && (
				<div className="mt-4 bg-background rounded p-4 border border-border">
					<div className="font-semibold mb-2 text-primary">AI Insight:</div>
					<div className="mb-2 text-text">{answer.insight || JSON.stringify(answer)}</div>
					{answer.chart && (
						<button
							className="mt-2 px-3 py-1 rounded-xl bg-surface border border-primary text-primary font-semibold hover:bg-primary hover:text-white shadow-button transition-all focus:outline-none focus:ring-2 focus:ring-primary/60"
							onClick={() => onChartSuggestion && onChartSuggestion(answer.chart)}
						>
							Render Suggested Chart
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default AIChat;
