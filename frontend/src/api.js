
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Something went wrong with the API request."
    );
  }

  return data;
}

// Generate a new food waste prediction
export async function createPrediction(inputData) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inputData),
  });

  return handleResponse(response);
}

// Retrieve prediction history
export async function getPredictionHistory(limit = 50) {
  const response = await fetch(
    `${API_BASE_URL}/history?limit=${limit}`
  );

  return handleResponse(response);
}

// Retrieve dashboard statistics
export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard-stats`);

  return handleResponse(response);
}

export default API_BASE_URL;
