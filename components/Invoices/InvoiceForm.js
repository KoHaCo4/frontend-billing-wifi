"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import Button from "@/components/UI/Button";
import { api } from "@/lib/api";

export default function InvoiceForm({ invoice, onSuccess, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm();

  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const watchPackageId = watch("package_id");
  const watchCustomerId = watch("customer_id");

  // Fetch customers and packages
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("📦 Fetching customers and packages...");
        const [customersRes, packagesRes] = await Promise.all([
          api.get("/customers?limit=1000"),
          api.get("/packages?all=true"),
        ]);

        console.log("✅ Customers:", customersRes.data.data?.length || 0);
        console.log("✅ Packages:", packagesRes.data.data?.length || 0);

        setCustomers(customersRes.data.data || []);
        setPackages(packagesRes.data.data || []);
      } catch (error) {
        console.error("❌ Failed to fetch data:", error);
        toast.error("Gagal memuat data");
      }
    };

    fetchData();
  }, []);

  // Set form values when editing or creating
  useEffect(() => {
    if (invoice) {
      // Edit mode
      console.log("✏️ Editing invoice:", invoice);
      reset({
        customer_id: invoice.customer_id?.toString() || "",
        package_id: invoice.package_id?.toString() || "",
        amount: invoice.amount || "",
        description: invoice.description || "",
        due_date: invoice.due_date
          ? new Date(invoice.due_date).toISOString().split("T")[0]
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
      });

      // Set selected customer
      if (invoice.customer_id) {
        const customer = customers.find((c) => c.id === invoice.customer_id);
        if (customer) setSelectedCustomer(customer);
      }

      // Set selected package
      if (invoice.package_id) {
        const pkg = packages.find((p) => p.id === invoice.package_id);
        if (pkg) setSelectedPackage(pkg);
      }
    } else {
      // Create mode - set default due date (7 days from now)
      const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      reset({
        due_date: defaultDueDate.toISOString().split("T")[0],
        customer_id: "",
        package_id: "",
        amount: "",
        description: "",
      });
    }
  }, [invoice, customers, packages, reset]);

  // Update amount when package is selected
  useEffect(() => {
    if (watchPackageId) {
      console.log("📦 Package selected:", watchPackageId);
      const pkg = packages.find(
        (p) => p.id.toString() === watchPackageId.toString()
      );
      if (pkg) {
        console.log("💰 Setting package price:", pkg.price);
        setSelectedPackage(pkg);
        setValue("amount", pkg.price);
        setValue(
          "description",
          `Pembayaran paket ${pkg.name} (${pkg.duration_days} hari)`
        );
      }
    }
  }, [watchPackageId, packages, setValue]);

  // Update package when customer is selected (auto-fill customer's current package)
  useEffect(() => {
    if (watchCustomerId) {
      console.log("👤 Customer selected:", watchCustomerId);
      const customer = customers.find(
        (c) => c.id.toString() === watchCustomerId.toString()
      );
      if (customer) {
        setSelectedCustomer(customer);

        // Auto-select customer's current package
        if (customer.package_id) {
          console.log(
            "📦 Auto-selecting customer package:",
            customer.package_id
          );
          setValue("package_id", customer.package_id.toString());
        }
      }
    }
  }, [watchCustomerId, customers, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    console.log("📝 Form data:", data);

    try {
      // Validate required fields
      if (!data.customer_id) {
        throw new Error("Customer harus dipilih");
      }
      if (!data.amount || data.amount <= 0) {
        throw new Error("Amount harus lebih dari 0");
      }
      if (!data.due_date) {
        throw new Error("Due date harus diisi");
      }

      // Prepare payload (convert string IDs to numbers)
      const payload = {
        customer_id: parseInt(data.customer_id),
        package_id: data.package_id ? parseInt(data.package_id) : null,
        amount: parseFloat(data.amount),
        description: data.description || "Manual invoice",
        due_date: data.due_date,
      };

      console.log("🚀 Sending payload:", payload);

      if (invoice) {
        // Update invoice - BUT NOTE: backend doesn't have update endpoint for invoices
        // Only status update or payment
        const response = await api.put(`/invoices/${invoice.id}`, payload);
        toast.success("Invoice updated!");
      } else {
        // Create invoice
        const response = await api.post("/invoices", payload);
        console.log("✅ Create response:", response.data);
        toast.success(`Invoice ${response.data.data?.invoice_number} created!`);
      }

      onSuccess();
    } catch (error) {
      console.error("❌ Save invoice error:", error);

      if (error.response) {
        console.error("Error response:", error.response.data);
        toast.error(error.response.data?.message || "Failed to save invoice");
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save invoice");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Customer Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Customer *
        </label>
        <select
          {...register("customer_id", {
            required: "Customer harus dipilih",
            onChange: (e) => {
              console.log("Customer dropdown onChange:", e.target.value);
            },
          })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">Pilih Customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id.toString()}>
              {customer.name} - {customer.username_pppoe} ({customer.phone})
            </option>
          ))}
        </select>
        {errors.customer_id && (
          <p className="text-red-500 text-sm mt-1">
            {errors.customer_id.message}
          </p>
        )}
        {selectedCustomer && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
            <p>
              Customer: <strong>{selectedCustomer.name}</strong>
            </p>
            <p>Paket: {selectedCustomer.package_name || "Belum ada paket"}</p>
          </div>
        )}
      </div>

      {/* Package Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paket
        </label>
        <select
          {...register("package_id")}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">Pilih Paket (Opsional)</option>
          {packages
            .filter((p) => p.is_active)
            .map((pkg) => (
              <option key={pkg.id} value={pkg.id.toString()}>
                {pkg.name} - Rp {parseFloat(pkg.price).toLocaleString("id-ID")}{" "}
                ({pkg.duration_days} hari)
              </option>
            ))}
        </select>
        {selectedPackage && (
          <div className="mt-2 p-2 bg-green-50 rounded text-sm">
            <p>
              Paket: <strong>{selectedPackage.name}</strong>
            </p>
            <p>
              Harga: Rp{" "}
              {parseFloat(selectedPackage.price).toLocaleString("id-ID")}
            </p>
            <p>Durasi: {selectedPackage.duration_days} hari</p>
          </div>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">Rp</span>
          <input
            type="number"
            step="0.01"
            {...register("amount", {
              required: "Amount harus diisi",
              min: { value: 1, message: "Amount minimal 1" },
              onChange: (e) => {
                console.log("Amount changed:", e.target.value);
              },
            })}
            className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            disabled={loading}
          />
        </div>
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deskripsi
        </label>
        <textarea
          {...register("description")}
          rows="3"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Deskripsi invoice..."
          disabled={loading}
        />
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Due Date *
        </label>
        <input
          type="date"
          {...register("due_date", {
            required: "Due date harus diisi",
            onChange: (e) => {
              console.log("Due date changed:", e.target.value);
            },
          })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        {errors.due_date && (
          <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>
        )}
      </div>

      {/* Debug Info */}
      <div className="p-3 bg-gray-50 rounded text-xs">
        <p className="font-medium">Debug Info:</p>
        <p>Selected Customer ID: {watchCustomerId || "None"}</p>
        <p>Selected Package ID: {watchPackageId || "None"}</p>
        <p>Amount: {watch("amount") || "0"}</p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Menyimpan...
            </span>
          ) : invoice ? (
            "Update Invoice"
          ) : (
            "Buat Invoice"
          )}
        </Button>
      </div>
    </form>
  );
}
