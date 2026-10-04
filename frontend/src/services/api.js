const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

/* ---- Session helpers ---- */

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  const raw = localStorage.getItem("user");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/* ---- Core request helper ---- */

async function request(
  path,
  { method = "GET", body, auth = false } = {}
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let res;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    console.error("NETWORK ERROR:", networkError);

    throw new Error(
      "Cannot reach the server. Check that the backend is running."
    );
  }

  if (res.status === 401) {
    clearSession();

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }

    throw new Error("Session expired");
  }

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    console.error("=================================");
    console.error("API ERROR");
    console.error("Status:", res.status);
    console.error("Method:", method);
    console.error("Path:", path);
    console.error("Response:", data);
    console.error("=================================");

    const message =
      data?.message ||
      data?.error ||
      data?.details ||
      `Request failed (${res.status}) on ${path}`;

    const error = new Error(message);

    error.status = res.status;
    error.data = data;

    throw error;
  }

  return data;
}

/* ---- Auth ---- */

export const register = (name, email, password) =>
  request("/api/auth/register", {
    method: "POST",
    body: {
      name,
      email,
      password,
    },
  });

export const login = (email, password) =>
  request("/api/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });

/* ---- Parking ---- */

export const getLots = () =>
  request("/api/lots", {
    auth: false,
  });

export const getSlots = () =>
  request("/api/slots", {
    auth: false,
  });

export const getBookings = () =>
  request("/api/bookings", {
    auth: false,
  });

/* ---- Bookings ---- */

export const getMyBookings = async () => {
  const data = await request("/api/my-bookings", {
    auth: true,
  });

  return Array.isArray(data)
    ? data
    : (data?.bookings ?? []);
};

export const createBooking = (
  slot_id,
  booking_date,
  start_time,
  end_time,
  vehicle_id
) =>
  request("/api/bookings", {
    method: "POST",
    auth: true,
    body: {
      slot_id,
      booking_date,
      start_time,
      end_time,
      vehicle_id: vehicle_id || null,
    },
  });

export const cancelBooking = (id) =>
  request(`/api/bookings/${id}/cancel`, {
    method: "PATCH",
    auth: true,
  });

/* ---- Vehicles ---- */

/* Verify vehicle registration number */
export const verifyVehicle = (vehicle_number) =>
  request("/api/vehicles/verify", {
    method: "POST",
    auth: true,
    body: {
      vehicle_number,
    },
  });

/* Get all vehicles */
export const getVehicles = () =>
  request("/api/vehicles", {
    auth: true,
  });

/* Create vehicle */
export const createVehicle = (payload) =>
  request("/api/vehicles", {
    method: "POST",
    auth: true,
    body: payload,
  });

/* Update vehicle */
export const updateVehicle = (id, payload) =>
  request(`/api/vehicles/${id}`, {
    method: "PATCH",
    auth: true,
    body: payload,
  });

/* Delete vehicle */
export const deleteVehicle = (id) =>
  request(`/api/vehicles/${id}`, {
    method: "DELETE",
    auth: true,
  });

/* =====================================================
   RAZORPAY PAYMENT
===================================================== */

export const createPaymentOrder = async (booking_id, amount) => {
  return request("/api/payment/create-order", {
    method: "POST",
    auth: true,
    body: {
      booking_id,
      amount,
    },
  });
};

export const verifyPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  booking_id,
}) => {
  return request("/api/payment/verify", {
    method: "POST",
    auth: true,
    body: {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id,
    },
  });
};