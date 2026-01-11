"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  Plus,
  Wifi,
  Server,
  TestTube,
  Trash2,
  Edit,
  WifiOff,
  CheckCircle2,
} from "lucide-react";
import DataTable from "@/components/UI/DataTable";
import Modal from "@/components/UI/Modal";
import Button from "@/components/UI/Button";
import StatusBadge from "@/components/UI/StatusBadge";
import RouterForm from "@/components/Routers/RouterForm";
import { api } from "@/lib/api";

// API functions - FIXED STRUCTURE
const fetchRouters = async () => {
  try {
    const response = await api.get("/routers?all=true");
    console.log("📡 Router API Response:", response.data);

    return {
      routers: response.data.data || [],
      total: response.data.data?.length || 0,
    };
  } catch (error) {
    console.error("❌ Fetch routers error:", error);
    toast.error("Failed to load routers");
    return { routers: [], total: 0 };
  }
};

// Test connection
const testRouterConnection = async (id) => {
  try {
    const response = await api.get(`/routers/${id}/test`);
    return response.data;
  } catch (error) {
    console.error("Test connection API error:", error);

    // Return error structure yang konsisten
    return {
      success: false,
      message: error.response?.data?.message || "Failed to test connection",
      data: {
        router: { id },
        reachable: false,
        error: error.message,
      },
    };
  }
};

// Delete router
const deleteRouter = async (id) => {
  const response = await api.delete(`/routers/${id}`);
  return response.data;
};

export default function RoutersPage() {
  // State declarations - HARUS DI ATAS SEMUA HOOKS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRouter, setSelectedRouter] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [statusFilter, setStatusFilter] = useState("all"); // Filter status

  const queryClient = useQueryClient();

  // Fetch routers - HOOK PERTAMA SETELAH STATE
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["routers"],
    queryFn: fetchRouters,
    refetchOnWindowFocus: false,
  });

  // HANYA SETELAH data didefinisikan, kita bisa membuat filteredRouters
  const filteredRouters =
    data?.routers?.filter((router) => {
      if (statusFilter === "all") return true;
      return router.status === statusFilter;
    }) || [];

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: testRouterConnection,
    onMutate: (id) => {
      setTestingId(id);
    },
    onSuccess: (result) => {
      console.log("✅ Test connection result:", result);

      // Simpan hasil test
      if (result.data?.router?.id) {
        setTestResults((prev) => ({
          ...prev,
          [result.data.router.id]: result,
        }));
      }

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-medium">{result.message}</div>
              {result.data?.system_info && (
                <div className="text-sm text-gray-600">
                  {result.data.system_info.board_name} -{" "}
                  {result.data.system_info.version}
                </div>
              )}
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        // Tampilkan detail error
        toast.error(
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <WifiOff className="w-5 h-5 text-red-500" />
              <div className="font-medium">Connection Failed</div>
            </div>
            <div className="text-sm text-gray-700 mb-2">{result.message}</div>

            {result.data?.ping_reachable === false && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                • Ping test failed - Router tidak bisa diakses
              </div>
            )}

            {result.data?.ping_reachable === true &&
              result.data?.api_reachable === false && (
                <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  • Ping successful but API failed
                  <div className="mt-1">
                    Error: {result.data?.api_error || "Unknown"}
                  </div>
                  <div className="mt-1">
                    Check:
                    <ul className="list-disc pl-4 mt-1">
                      <li>API Service enabled on MikroTik</li>
                      <li>Correct username/password</li>
                      <li>
                        Firewall allows port{" "}
                        {result.data?.router?.api_port || 8728}
                      </li>
                    </ul>
                  </div>
                </div>
              )}
          </div>,
          { duration: 8000 }
        );
      }

      queryClient.invalidateQueries(["routers"]);
    },
    onError: (error) => {
      console.error("Test connection mutation error:", error);

      toast.error(
        <div className="flex items-center gap-2">
          <WifiOff className="w-5 h-5 text-red-500" />
          <div>
            <div className="font-medium">Network Error</div>
            <div className="text-sm text-gray-600">
              {error.response?.data?.message || "Failed to connect to router"}
            </div>
          </div>
        </div>,
        { duration: 5000 }
      );
    },
    onSettled: () => {
      setTestingId(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRouter,
    onSuccess: () => {
      toast.success("✅ Router deleted successfully");
      queryClient.invalidateQueries(["routers"]);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete router");
    },
  });

  // Columns definition - FIXED untuk data backend
  const columns = [
    {
      key: "name",
      label: "Router Name",
      render: (value, row) => {
        const testResult = testResults[row.id];
        const isTesting = testingId === row.id;

        return (
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                testResult?.success && testResult?.data?.reachable
                  ? "bg-green-100"
                  : testResult
                  ? "bg-red-100"
                  : row.status === "active"
                  ? "bg-purple-100"
                  : "bg-gray-100"
              }`}
            >
              <Server
                className={`w-5 h-5 ${
                  testResult?.success && testResult?.data?.reachable
                    ? "text-green-600"
                    : testResult
                    ? "text-red-600"
                    : row.status === "active"
                    ? "text-purple-600"
                    : "text-gray-400"
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{value}</div>
              <div className="text-sm text-gray-500 truncate">
                {row.ip_address}:{row.api_port || row.port}
                {row.status === "inactive" && (
                  <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                    Inactive
                  </span>
                )}
                {isTesting && (
                  <span className="ml-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                    Testing...
                  </span>
                )}
                {testResult && !isTesting && (
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded ${
                      testResult.success && testResult.data.reachable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {testResult.success && testResult.data.reachable
                      ? "Reachable"
                      : "Unreachable"}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: "created_at",
      label: "Created",
      render: (value) => (
        <div className="text-sm">
          {new Date(value).toLocaleDateString("id-ID")}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const isTesting = testingId === row.id;
        const testResult = testResults[row.id];

        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                testMutation.mutate(row.id);
              }}
              disabled={isTesting || row.status === "inactive"}
              className={`p-2 rounded-lg transition-colors ${
                testResult?.success && testResult?.data?.reachable
                  ? "text-green-600 hover:text-green-900 hover:bg-green-50"
                  : testResult
                  ? "text-red-600 hover:text-red-900 hover:bg-red-50"
                  : row.status === "inactive"
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-green-600 hover:text-green-900 hover:bg-green-50"
              }`}
              title={
                row.status === "inactive"
                  ? "Cannot test inactive router"
                  : "Test Connection"
              }
            >
              {isTesting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-500" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRouter(row);
                setIsModalOpen(true);
              }}
              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Router"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete router "${row.name}"?`)) {
                  deleteMutation.mutate(row.id);
                }
              }}
              disabled={deleteMutation.isLoading}
              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Router"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // Error state
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Routers</h3>
          <p className="text-red-600 text-sm mt-1">
            {error.message || "Unknown error occurred"}
          </p>
          <button
            onClick={() => queryClient.refetchQueries(["routers"])}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Routers</h1>
            <p className="text-gray-600">
              Manage MikroTik routers and connections
            </p>
          </div>

          <Button
            onClick={() => {
              setSelectedRouter(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Router
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Routers</h3>
          <p className="text-2xl font-bold mt-1">{data?.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Active</h3>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {data?.routers?.filter((r) => r.status === "active").length || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Inactive</h3>
          <p className="text-2xl font-bold mt-1 text-red-600">
            {data?.routers?.filter((r) => r.status === "inactive").length || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Tested</h3>
          <p className="text-2xl font-bold mt-1 text-blue-600">
            {Object.keys(testResults).length || 0}
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({data?.total || 0})
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "active"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Active (
          {data?.routers?.filter((r) => r.status === "active").length || 0})
        </button>
        <button
          onClick={() => setStatusFilter("inactive")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "inactive"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Inactive (
          {data?.routers?.filter((r) => r.status === "inactive").length || 0})
        </button>
      </div>

      {/* Router Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredRouters}
          loading={isLoading}
          searchable={true}
          searchPlaceholder="Search by name or IP..."
          pagination={true}
          itemsPerPage={10}
          onRowClick={(row) => {
            setSelectedRouter(row);
            setIsModalOpen(true);
          }}
        />
      </div>

      {/* Test Results Summary */}
      {Object.keys(testResults).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Connection Test Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(testResults).map(([routerId, result]) => {
              const router = data?.routers?.find((r) => r.id == routerId);
              if (!router) return null;

              return (
                <div
                  key={routerId}
                  className={`p-4 rounded-lg border ${
                    result.success && result.data?.reachable
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{router.name}</div>
                      <div className="text-sm text-gray-600">
                        {router.ip_address}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge status={router.status} />
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.success && result.data?.reachable
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {result.success && result.data?.reachable
                          ? "✅ Reachable"
                          : "❌ Unreachable"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {result.message}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Tested at {new Date().toLocaleTimeString("id-ID")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Router Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRouter(null);
        }}
        title={selectedRouter ? "Edit Router" : "Add New Router"}
        size="md"
      >
        <RouterForm
          router={selectedRouter}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedRouter(null);
            queryClient.invalidateQueries(["routers"]);
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedRouter(null);
          }}
        />
      </Modal>
    </div>
  );
}
