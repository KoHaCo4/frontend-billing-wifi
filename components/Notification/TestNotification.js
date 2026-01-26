import { useState } from "react";
import Button from "../UI/Button";
import Modal from "../UI/Modal";
import { useApi } from "../../hooks/useApi";

const TestNotification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { post, get } = useApi();

  const handleTestNotification = async () => {
    if (!phone) {
      alert("Masukkan nomor telepon terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const response = await post("/notifications/test", {
        phone,
        message: message || "Ini adalah pesan test dari Billing WiFi System",
      });

      if (response.success) {
        setResult({
          success: true,
          message: "Notifikasi berhasil dikirim!",
          data: response.data,
        });
      } else {
        setResult({
          success: false,
          message: response.message || "Gagal mengirim notifikasi",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message || "Terjadi kesalahan",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerReminder = async () => {
    setLoading(true);
    try {
      const response = await get("/notifications/trigger-reminder");
      if (response.success) {
        setResult({
          success: true,
          message: response.message,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsOpen(true)}>
        Test Notifikasi
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setResult(null);
        }}
        title="Test Notifikasi WhatsApp"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              placeholder="81234567890 (tanpa +62 atau 0)"
              className="w-full px-3 py-2 border rounded-md"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Contoh: 81234567890</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Pesan (opsional)
            </label>
            <textarea
              placeholder="Masukkan pesan custom"
              className="w-full px-3 py-2 border rounded-md"
              rows="3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {result && (
            <div
              className={`p-3 rounded-md ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {result.message}
              {result.data && (
                <pre className="mt-2 text-xs overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button
              onClick={handleTestNotification}
              disabled={loading || !phone}
              loading={loading}
            >
              Kirim Test
            </Button>

            <Button
              variant="outline"
              onClick={handleTriggerReminder}
              disabled={loading}
            >
              Trigger Reminder Job
            </Button>

            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TestNotification;
