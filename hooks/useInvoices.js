// hooks/useInvoices.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api";

export function useInvoiceMutations() {
  const queryClient = useQueryClient();

  // Function untuk pay invoice dengan debugging
  const payInvoice = async (invoiceId, paymentAmount, payment_method) => {
    try {
      console.log(`💳 Pay invoice request:`, {
        invoiceId,
        paymentAmount,
        payment_method,
      });

      // Validasi data sebelum dikirim
      if (!invoiceId) throw new Error("Invoice ID is required");
      if (!paymentAmount || paymentAmount <= 0)
        throw new Error("Valid payment amount is required");
      if (!payment_method) throw new Error("Payment method is required");

      const payload = {
        amount: parseFloat(paymentAmount),
        payment_method,
        reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        notes: "Payment via dashboard",
      };

      console.log(`📤 Sending payload:`, payload);

      const response = await api.post(`/invoices/${invoiceId}/pay`, payload, {
        timeout: 30000,
        headers: { "Content-Type": "application/json" },
      });

      console.log(`✅ Pay invoice response:`, response);

      let result = response.data;

      // Handle different response formats
      if (result && typeof result === "object") {
        if (result.data && result.success !== undefined) {
          result = result.data;
        } else if (result.success === false) {
          throw new Error(result.message || "Payment failed");
        }
      }

      console.log(`🎯 Processed result:`, result);

      return result;
    } catch (error) {
      console.error("❌ Pay invoice error details:", {
        name: error.name,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        },
      });

      let errorMessage = "Failed to process payment";

      if (error.response) {
        // Server responded with error
        const serverError = error.response.data;

        if (serverError?.message) {
          errorMessage = serverError.message;
        } else if (serverError?.error) {
          errorMessage = serverError.error;
        } else if (typeof serverError === "string") {
          errorMessage = serverError;
        }

        console.log(`🔍 Server error details:`, serverError);
      } else if (error.request) {
        // Request was made but no response
        errorMessage = "No response from server. Check your connection.";
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timeout. Please try again.";
      }

      throw new Error(errorMessage);
    }
  };

  // Pay mutation
  const payMutation = useMutation({
    mutationFn: ({ invoiceId, amount, paymentMethod }) =>
      payInvoice(invoiceId, amount, paymentMethod),
    onSuccess: (data) => {
      console.log("✅ Payment mutation success:", data);
      toast.success("Invoice paid successfully!");

      // Invalidate related queries
      queryClient.invalidateQueries(["invoices"]);
      queryClient.invalidateQueries(["dashboard-stats"]);
      queryClient.invalidateQueries(["customers"]);
      queryClient.invalidateQueries(["transactions"]);
    },
    onError: (error) => {
      console.error("❌ Payment mutation error:", error);
      toast.error(error.message || "Failed to process payment");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (invoiceId) => {
      try {
        console.log(`🗑️ Deleting invoice: ${invoiceId}`);
        const response = await api.delete(`/invoices/${invoiceId}`);
        return response.data;
      } catch (error) {
        console.error("Delete invoice error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Invoice deleted successfully");
      queryClient.invalidateQueries(["invoices"]);
    },
    onError: (error) => {
      console.error("Delete invoice error:", error);
      toast.error(error.response?.data?.message || "Failed to delete invoice");
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (invoiceId) => {
      try {
        console.log(`❌ Cancelling invoice: ${invoiceId}`);
        const response = await api.post(`/invoices/${invoiceId}/cancel`);
        return response.data;
      } catch (error) {
        console.error("Cancel invoice error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Invoice cancelled successfully");
      queryClient.invalidateQueries(["invoices"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to cancel invoice");
    },
  });

  return {
    // Pay invoice
    payInvoice: payMutation.mutate,
    isPaying: payMutation.isLoading,
    payError: payMutation.error,

    // Delete invoice
    deleteInvoice: deleteMutation.mutate,
    isDeleting: deleteMutation.isLoading,

    // Cancel invoice
    cancelInvoice: cancelMutation.mutate,
    isCancelling: cancelMutation.isLoading,
  };
}
