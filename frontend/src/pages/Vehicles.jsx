import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import VehicleCard from "../components/VehicleCard";
import VehicleForm from "../components/VehicleForm";

import {
  CarIcon,
  PlusIcon,
} from "../components/Icons";

import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "../services/api";

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toast, setToast] = useState({
    msg: "",
    type: "",
  });

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deleting, setDeleting] = useState(false);

  // --------------------------------
  // Toast
  // --------------------------------

  const showToast = (
    msg,
    type = "success"
  ) => {
    setToast({
      msg,
      type,
    });

    setTimeout(() => {
      setToast({
        msg: "",
        type: "",
      });
    }, 3500);
  };

  // --------------------------------
  // Load vehicles
  // --------------------------------

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getVehicles();

      setVehicles(
        Array.isArray(data)
          ? data
          : data?.vehicles ?? []
      );
    } catch (err) {
      setError(
        "Unable to load vehicles. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // --------------------------------
  // Add / Edit
  // --------------------------------

  const openAdd = () => {
    setEditTarget(null);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (vehicle) => {
    setEditTarget(vehicle);
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditTarget(null);
    setFormError("");
  };

  const handleSave = async (payload) => {
    setSaving(true);
    setFormError("");

    try {
      if (editTarget) {
        await updateVehicle(
          editTarget.id,
          payload
        );

        showToast(
          "Vehicle updated successfully."
        );
      } else {
        await createVehicle(payload);

        showToast(
          "Vehicle added successfully."
        );
      }

      closeForm();
      await load();
    } catch (err) {
      setFormError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------
  // Delete
  // --------------------------------

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteVehicle(deleteTarget.id);

      showToast("Vehicle removed.");

      setDeleteTarget(null);

      await load();
    } catch (err) {
      showToast(
        err.message || "Delete failed.",
        "error"
      );

      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------
  // Display name
  // --------------------------------

  const displayName = (vehicle) => {
    return (
      [vehicle.brand, vehicle.model]
        .filter(Boolean)
        .join(" ") ||
      vehicle.vehicle_number
    );
  };

  return (
    <div className="page-wrapper">

      <Navbar />

      <main className="page-content">

        {/* Page Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 className="text-page-title">
              My Vehicles
            </h1>

            <p
              className="text-secondary"
              style={{ marginTop: 4 }}
            >
              Manage your registered vehicles.
              Add a vehicle to book compatible
              parking slots faster.
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={openAdd}
            style={{ flexShrink: 0 }}
          >
            <PlusIcon />
            Add Vehicle
          </button>
        </div>

        {/* Toast */}
        {toast.msg && (
          <div
            className={
              toast.type === "error"
                ? "toast-error"
                : "toast-success"
            }
            style={{
              marginBottom: 20,
            }}
          >
            {toast.msg}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="vehicles-grid">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="skeleton"
                style={{
                  height: 148,
                  borderRadius: 12,
                }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="empty-state">

            <p
              className="empty-state-title"
              style={{
                color: "var(--error)",
              }}
            >
              Failed to load vehicles
            </p>

            <p className="empty-state-body">
              {error}
            </p>

            <button
              className="btn-primary"
              onClick={load}
            >
              Try Again
            </button>

          </div>
        )}

        {/* Empty State */}
        {!loading &&
          !error &&
          vehicles.length === 0 && (
            <div className="empty-state">

              <div
                className="empty-state-icon"
                style={{
                  color:
                    "var(--border-strong)",
                }}
              >
                <CarIcon size={48} />
              </div>

              <p className="empty-state-title">
                No vehicles added yet
              </p>

              <p className="empty-state-body">
                Add your first vehicle to make
                parking bookings faster and
                unlock slot compatibility
                filtering.
              </p>

              <button
                className="btn-primary"
                onClick={openAdd}
              >
                <PlusIcon />
                Add Vehicle
              </button>

            </div>
          )}

        {/* Vehicles */}
        {!loading &&
          !error &&
          vehicles.length > 0 && (
            <div className="vehicles-grid">

              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}

            </div>
          )}

      </main>

      {/* Add / Edit Modal */}
      {formOpen && (
        <>
          <VehicleForm
            initial={editTarget}
            onSave={handleSave}
            onCancel={closeForm}
            saving={saving}
          />

          {formError && (
            <div
              className="toast-error"
              style={{
                position: "fixed",
                bottom: 24,
                left: "50%",
                transform:
                  "translateX(-50%)",
                zIndex: 300,
                whiteSpace: "nowrap",
              }}
            >
              {formError}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          className="form-modal-overlay"
          onClick={() =>
            setDeleteTarget(null)
          }
        >
          <div
            className="form-modal"
            style={{ maxWidth: 380 }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h2 className="form-modal-title">
              Remove vehicle?
            </h2>

            <p
              style={{
                fontSize: 14,
                color:
                  "var(--text-secondary)",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to remove{" "}
              <strong>
                {displayName(deleteTarget)}
              </strong>{" "}
              ({deleteTarget.vehicle_number})?
              This cannot be undone.
            </p>

            <div className="form-actions">

              <button
                className="btn-secondary"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
              >
                Keep Vehicle
              </button>

              <button
                className="btn-danger"
                onClick={
                  handleDeleteConfirm
                }
                disabled={deleting}
                style={{ flex: 1 }}
              >
                {deleting && (
                  <span
                    className="spinner"
                    style={{
                      width: 14,
                      height: 14,
                      borderTopColor:
                        "var(--error)",
                    }}
                  />
                )}

                {deleting
                  ? "Removing..."
                  : "Remove"}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Vehicles;