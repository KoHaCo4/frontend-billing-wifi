// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useForm } from "react-hook-form";
// import { toast } from "react-hot-toast";
// import Button from "@/components/UI/Button";
// import { api } from "@/lib/api";
// import { CheckCircle, XCircle, Loader2 } from "lucide-react";

// export default function RouterForm({ router, onSuccess, onCancel }) {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset,
//     watch,
//     setError,
//     clearErrors,
//   } = useForm();

//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [existingIps, setExistingIps] = useState([]);
//   const [ipValidation, setIpValidation] = useState({
//     checking: false,
//     available: null,
//     message: "",
//   });

//   // Watch IP address untuk validasi
//   const watchIpAddress = watch("ip_address");
//   const debounceTimeout = useRef(null);

//   // Fetch existing routers untuk validasi IP unik
//   useEffect(() => {
//     const fetchExistingRouters = async () => {
//       try {
//         const response = await api.get("/routers?all=true");
//         if (response.data.success) {
//           const routers = response.data.data || [];
//           // Simpan semua data router, bukan hanya IP
//           setExistingRouters(routers);
//         }
//       } catch (error) {
//         console.error("Failed to fetch routers:", error);
//       }
//     };

//     fetchExistingRouters();
//   }, []);

//   useEffect(() => {
//     if (router) {
//       // Edit mode - set semua field kecuali password
//       reset({
//         name: router.name,
//         ip_address: router.ip_address,
//         port: router.port || 8728,
//         api_port: router.api_port || 8728,
//         username: router.username,
//         password: "", // SELALU KOSONG untuk edit mode
//         status: router.status || "active",
//       });
//       console.log("✏️ Edit mode - Password field reset to empty");
//     } else {
//       // Create mode
//       reset({
//         name: "",
//         ip_address: "",
//         port: 8728,
//         api_port: 8728,
//         username: "admin",
//         password: "", // Required untuk create
//         status: "active",
//       });
//     }
//   }, [router, reset]);

//   // Validasi IP address unik saat berubah
//   useEffect(() => {
//     if (!watchIpAddress || watchIpAddress.trim() === "") {
//       setIpValidation({ checking: false, available: null, message: "" });
//       clearErrors("ip_address");
//       return;
//     }

//     // Validasi format IP
//     const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
//     if (!ipPattern.test(watchIpAddress)) {
//       setIpValidation({
//         checking: false,
//         available: false,
//         message: "Format IP tidak valid",
//       });
//       setError("ip_address", {
//         type: "manual",
//         message: "Format IP tidak valid (contoh: 192.168.1.1)",
//       });
//       return;
//     }

//     // Cek validitas setiap bagian IP
//     const parts = watchIpAddress.split(".");
//     const isValidParts = parts.every(
//       (part) => parseInt(part) >= 0 && parseInt(part) <= 255
//     );
//     if (!isValidParts) {
//       setIpValidation({
//         checking: false,
//         available: false,
//         message: "Setiap bagian IP harus 0-255",
//       });
//       setError("ip_address", {
//         type: "manual",
//         message: "Setiap bagian IP harus antara 0-255",
//       });
//       return;
//     }

//     // Debounce validasi
//     setIpValidation({
//       checking: true,
//       available: null,
//       message: "Memeriksa ketersediaan IP...",
//     });

//     // Clear timeout sebelumnya
//     if (debounceTimeout.current) {
//       clearTimeout(debounceTimeout.current);
//     }

//     // Set timeout baru untuk debounce
//     debounceTimeout.current = setTimeout(async () => {
//       try {
//         // Fetch data router terbaru untuk validasi
//         const response = await api.get("/routers?all=true");
//         if (response.data.success) {
//           const routers = response.data.data || [];

//           // Cek apakah IP sudah digunakan oleh router lain
//           const isDuplicate = routers.some(
//             (r) =>
//               r.ip_address === watchIpAddress && (!router || r.id !== router.id) // Kecuali router yang sedang diedit
//           );

//           if (isDuplicate) {
//             setIpValidation({
//               checking: false,
//               available: false,
//               message: "IP sudah digunakan oleh router lain",
//             });
//             setError("ip_address", {
//               type: "manual",
//               message: "IP sudah digunakan oleh router lain",
//             });
//           } else {
//             setIpValidation({
//               checking: false,
//               available: true,
//               message: "IP tersedia",
//             });
//             clearErrors("ip_address");
//           }
//         }
//       } catch (error) {
//         console.error("Gagal memvalidasi IP:", error);
//         setIpValidation({
//           checking: false,
//           available: null,
//           message: "Gagal memvalidasi IP",
//         });
//       }
//     }, 500); // Debounce 500ms
//   }, [watchIpAddress, router, setError, clearErrors]);

//   const onSubmit = async (data) => {
//     setLoading(true);
//     console.log("📝 Form data submitted:", data);

//     try {
//       // Validasi untuk create mode
//       if (!router && (!data.password || data.password.trim() === "")) {
//         throw new Error("Password is required for new router");
//       }

//       // Validasi IP address format
//       const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
//       if (!ipPattern.test(data.ip_address)) {
//         throw new Error("Invalid IP address format (e.g., 192.168.1.1)");
//       }

//       // Validasi IP unik (frontend check tambahan)
//       if (!router) {
//         const isDuplicate = existingIps.some((ip) => ip === data.ip_address);
//         if (isDuplicate) {
//           throw new Error("IP address already used by another router");
//         }
//       }

//       // Siapkan payload
//       const payload = {
//         name: data.name,
//         ip_address: data.ip_address,
//         port: parseInt(data.port),
//         api_port: parseInt(data.api_port),
//         username: data.username,
//         status: data.status,
//       };

//       // Untuk update: hanya kirim password jika diisi
//       // Untuk create: selalu kirim password (required)
//       if (router) {
//         // Edit mode - hanya kirim password jika diisi
//         if (data.password && data.password.trim() !== "") {
//           payload.password = data.password;
//           console.log("🔐 Sending new password for update");
//         } else {
//           console.log("🔒 Keeping old password (not sending password field)");
//           // Tidak kirim password field sama sekali
//         }
//       } else {
//         // Create mode - selalu kirim password
//         payload.password = data.password;
//       }

//       console.log("🚀 Final payload:", payload);

//       const url = router ? `/routers/${router.id}` : `/routers`;
//       const method = router ? "put" : "post";

//       const response = await api[method](url, payload);
//       console.log("✅ Response:", response.data);

//       toast.success(
//         router
//           ? "✅ Router updated successfully!"
//           : "✅ Router created successfully!"
//       );
//       onSuccess();
//     } catch (error) {
//       console.error("❌ Save router error:", error);

//       // Tampilkan error yang user-friendly
//       let errorMessage = "Failed to save router";

//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//         // Handle duplicate IP error dengan pesan yang lebih jelas
//         if (
//           errorMessage.includes("Duplicate entry") &&
//           errorMessage.includes("ip_address_unique")
//         ) {
//           errorMessage =
//             "IP address already used by another router. Please use a different IP.";
//         }
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       // Tampilkan toast error dengan detail
//       toast.error(
//         <div className="max-w-md">
//           <div className="font-medium">{errorMessage}</div>
//           {errorDetails && (
//             <div className="text-sm text-gray-600 mt-1">{errorDetails}</div>
//           )}
//           {error.response?.status === 500 && (
//             <div className="text-xs text-gray-500 mt-2">
//               Server error. Please try again or contact administrator.
//             </div>
//           )}
//         </div>,
//         { duration: 6000 }
//       );

//       // Juga tampilkan inline error di form jika IP duplicate
//       if (errorMessage.includes("IP address already")) {
//         setError("ip_address", {
//           type: "manual",
//           message: "IP address already used by another router",
//         });
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//       {/* Router Name */}
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Router Name *
//         </label>
//         <input
//           type="text"
//           {...register("name", { required: "Router name is required" })}
//           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           placeholder="e.g., Main Office Router"
//           disabled={loading}
//         />
//         {errors.name && (
//           <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
//         )}
//       </div>

//       {/* IP Address dengan Validasi Real-time */}
//       {/* IP Address dengan Validasi Real-time */}
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           IP Address *
//         </label>
//         <input
//           type="text"
//           {...register("ip_address", {
//             required: "IP address is required",
//             pattern: {
//               value: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
//               message: "Invalid IP address format (e.g., 192.168.1.1)",
//             },
//             validate: (value) => {
//               if (ipValidation.available === false) {
//                 return "IP already used or invalid";
//               }
//               return true;
//             },
//           })}
//           className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
//             errors.ip_address || ipValidation.available === false
//               ? "border-red-300 focus:ring-red-500"
//               : ipValidation.available === true
//               ? "border-green-300 focus:ring-green-500"
//               : "border-gray-300 focus:ring-blue-500"
//           }`}
//           placeholder="192.168.1.1"
//           disabled={loading}
//         />

//         {/* Validation Status */}
//         <div className="mt-2">
//           {ipValidation.checking && (
//             <div className="flex items-center gap-2 text-blue-600 text-sm">
//               <Loader2 className="w-4 h-4 animate-spin" />
//               <span>{ipValidation.message}</span>
//             </div>
//           )}

//           {ipValidation.available === true && !errors.ip_address && (
//             <div className="flex items-center gap-2 text-green-600 text-sm">
//               <CheckCircle className="w-4 h-4" />
//               <span>{ipValidation.message}</span>
//             </div>
//           )}

//           {ipValidation.available === false && (
//             <div className="flex items-center gap-2 text-red-600 text-sm">
//               <XCircle className="w-4 h-4" />
//               <span>{ipValidation.message}</span>
//             </div>
//           )}

//           {errors.ip_address && (
//             <p className="text-red-500 text-sm mt-1">
//               {errors.ip_address.message}
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Ports */}
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Port *
//           </label>
//           <input
//             type="number"
//             {...register("port", {
//               required: "Port is required",
//               min: { value: 1, message: "Minimum port is 1" },
//               max: { value: 65535, message: "Maximum port is 65535" },
//             })}
//             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="8728"
//             disabled={loading}
//           />
//           {errors.port && (
//             <p className="text-red-500 text-sm mt-1">{errors.port.message}</p>
//           )}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             API Port *
//           </label>
//           <input
//             type="number"
//             {...register("api_port", {
//               required: "API port is required",
//               min: { value: 1, message: "Minimum port is 1" },
//               max: { value: 65535, message: "Maximum port is 65535" },
//             })}
//             className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="8728"
//             disabled={loading}
//           />
//           {errors.api_port && (
//             <p className="text-red-500 text-sm mt-1">
//               {errors.api_port.message}
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Username */}
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Username *
//         </label>
//         <input
//           type="text"
//           {...register("username", { required: "Username is required" })}
//           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           placeholder="admin"
//           disabled={loading}
//         />
//         {errors.username && (
//           <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
//         )}
//       </div>

//       {/* Password */}
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Password {router ? "(leave empty to keep current)" : "*"}
//         </label>
//         <div className="relative">
//           <input
//             type={showPassword ? "text" : "password"}
//             {...register(
//               "password",
//               router
//                 ? {
//                     validate: (value) => {
//                       // Password optional untuk update, tapi jika diisi minimal 3 karakter
//                       if (value && value.trim() !== "" && value.length < 3) {
//                         return "Password must be at least 3 characters";
//                       }
//                       return true;
//                     },
//                   }
//                 : {
//                     required: "Password is required",
//                     minLength: { value: 3, message: "Minimum 3 characters" },
//                   }
//             )}
//             className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder={router ? "•••••••• (keep current)" : "••••••••"}
//             autoComplete="new-password"
//             disabled={loading}
//           />
//           <button
//             type="button"
//             className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
//             onClick={() => setShowPassword(!showPassword)}
//             disabled={loading}
//           >
//             {showPassword ? "Hide" : "Show"}
//           </button>
//         </div>
//         {errors.password && (
//           <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
//         )}
//         {router && (
//           <p className="text-xs text-gray-500 mt-1">
//             Only fill if you want to change the password
//           </p>
//         )}
//       </div>

//       {/* Status */}
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Status
//         </label>
//         <select
//           {...register("status")}
//           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           disabled={loading}
//         >
//           <option value="active">Active</option>
//           <option value="inactive">Inactive</option>
//         </select>
//       </div>

//       {/* Buttons */}
//       <div className="flex justify-end gap-3 pt-4 border-t">
//         <Button
//           type="button"
//           variant="outline"
//           onClick={onCancel}
//           disabled={loading}
//         >
//           Cancel
//         </Button>
//         <Button
//           type="submit"
//           disabled={
//             loading || errors.ip_address || ipValidation.available === false
//           }
//           className="min-w-[120px]"
//         >
//           {loading ? (
//             <span className="flex items-center gap-2">
//               <Loader2 className="w-4 h-4 animate-spin" />
//               Saving...
//             </span>
//           ) : router ? (
//             "Update Router"
//           ) : (
//             "Create Router"
//           )}
//         </Button>
//       </div>

//       {/* Buttons
//       <div className="flex justify-end gap-3 pt-4 border-t">
//         <Button
//           type="button"
//           variant="outline"
//           onClick={onCancel}
//           disabled={loading}
//         >
//           Cancel
//         </Button>
//         <Button
//           type="submit"
//           disabled={loading || errors.ip_address}
//           className="min-w-[120px]"
//         >
//           {loading ? (
//             <span className="flex items-center gap-2">
//               <svg
//                 className="animate-spin h-4 w-4 text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 ></circle>
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                 ></path>
//               </svg>
//               Saving...
//             </span>
//           ) : router ? (
//             "Update Router"
//           ) : (
//             "Create Router"
//           )}
//         </Button>
//       </div> */}
//     </form>
//   );
// }

"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Button from "@/components/UI/Button";
import { api } from "@/lib/api";

export default function RouterForm({ router, onSuccess, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setError,
    clearErrors,
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [ipValidation, setIpValidation] = useState({
    checking: false,
    available: null,
    message: "",
  });
  const [existingRouters, setExistingRouters] = useState([]); // ✅ TAMBAHKAN INI

  // Watch IP address untuk validasi
  const watchIpAddress = watch("ip_address");
  const debounceTimeout = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  // Fetch existing routers untuk validasi IP unik (dilakukan sekali)
  useEffect(() => {
    const fetchExistingRouters = async () => {
      try {
        const response = await api.get("/routers?all=true");
        if (response.data.success) {
          const routers = response.data.data || [];
          setExistingRouters(routers); // ✅ INI SUDAH DAPAT DIGUNAKAN
        }
      } catch (error) {
        console.error("Failed to fetch routers:", error);
      }
    };

    fetchExistingRouters();
  }, []);

  // Validasi real-time IP address dengan debounce
  useEffect(() => {
    if (!watchIpAddress || watchIpAddress.trim() === "") {
      setIpValidation({ checking: false, available: null, message: "" });
      clearErrors("ip_address");
      return;
    }

    // Validasi format IP
    const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipPattern.test(watchIpAddress)) {
      setIpValidation({
        checking: false,
        available: false,
        message: "Format IP tidak valid",
      });
      setError("ip_address", {
        type: "manual",
        message: "Format IP tidak valid (contoh: 192.168.1.1)",
      });
      return;
    }

    // Cek validitas setiap bagian IP
    const parts = watchIpAddress.split(".");
    const isValidParts = parts.every(
      (part) => parseInt(part) >= 0 && parseInt(part) <= 255
    );
    if (!isValidParts) {
      setIpValidation({
        checking: false,
        available: false,
        message: "Setiap bagian IP harus 0-255",
      });
      setError("ip_address", {
        type: "manual",
        message: "Setiap bagian IP harus antara 0-255",
      });
      return;
    }

    // Debounce validasi
    setIpValidation({
      checking: true,
      available: null,
      message: "Memeriksa ketersediaan IP...",
    });

    // Clear timeout sebelumnya
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set timeout baru untuk debounce
    debounceTimeout.current = setTimeout(async () => {
      try {
        // Fetch data router terbaru untuk validasi
        const response = await api.get("/routers?all=true");
        if (response.data.success) {
          const routers = response.data.data || [];

          // Cek apakah IP sudah digunakan oleh router lain
          const isDuplicate = routers.some(
            (r) =>
              r.ip_address === watchIpAddress && (!router || r.id !== router.id) // Kecuali router yang sedang diedit
          );

          if (isDuplicate) {
            setIpValidation({
              checking: false,
              available: false,
              message: "IP sudah digunakan oleh router lain",
            });
            setError("ip_address", {
              type: "manual",
              message: "",
            });
          } else {
            setIpValidation({
              checking: false,
              available: true,
              message: "IP tersedia",
            });
            clearErrors("ip_address");
          }
        }
      } catch (error) {
        console.error("Gagal memvalidasi IP:", error);
        setIpValidation({
          checking: false,
          available: null,
          message: "Gagal memvalidasi IP",
        });
      }
    }, 500); // Debounce 500ms
  }, [watchIpAddress, router, setError, clearErrors]);

  // Reset form ketika router berubah (edit mode)
  useEffect(() => {
    if (router) {
      // Edit mode - set semua field kecuali password
      reset({
        name: router.name,
        ip_address: router.ip_address,
        port: router.port || 8728,
        api_port: router.api_port || 8728,
        username: router.username,
        password: "", // SELALU KOSONG untuk edit mode
        status: router.status || "active",
      });
      console.log("✏️ Edit mode - Password field reset to empty");
    } else {
      // Create mode
      reset({
        name: "",
        ip_address: "",
        port: 8728,
        api_port: 8728,
        username: "admin",
        password: "", // Required untuk create
        status: "active",
      });
    }
  }, [router, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    console.log("📝 Form data submitted:", data);

    try {
      // Validasi untuk create mode
      if (!router && (!data.password || data.password.trim() === "")) {
        throw new Error("Password is required for new router");
      }

      // Validasi IP address format
      const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (!ipPattern.test(data.ip_address)) {
        throw new Error("Invalid IP address format (e.g., 192.168.1.1)");
      }

      // Final validation dari state ipValidation
      if (ipValidation.available === false) {
        throw new Error("IP address already used by another router");
      }

      // Siapkan payload
      const payload = {
        name: data.name,
        ip_address: data.ip_address,
        port: parseInt(data.port),
        api_port: parseInt(data.api_port),
        username: data.username,
        status: data.status,
      };

      // Untuk update: hanya kirim password jika diisi
      // Untuk create: selalu kirim password (required)
      if (router) {
        // Edit mode - hanya kirim password jika diisi
        if (data.password && data.password.trim() !== "") {
          payload.password = data.password;
          console.log("🔐 Sending new password for update");
        } else {
          console.log("🔒 Keeping old password (not sending password field)");
          // Tidak kirim password field sama sekali
        }
      } else {
        // Create mode - selalu kirim password
        payload.password = data.password;
      }

      console.log("🚀 Final payload:", payload);

      const url = router ? `/routers/${router.id}` : `/routers`;
      const method = router ? "put" : "post";

      const response = await api[method](url, payload);
      console.log("✅ Response:", response.data);

      toast.success(
        router
          ? "✅ Router updated successfully!"
          : "✅ Router created successfully!"
      );
      onSuccess();
    } catch (error) {
      console.error("❌ Save router error:", error);

      // Tampilkan error yang user-friendly
      let errorMessage = "Failed to save router";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        // Handle duplicate IP error dengan pesan yang lebih jelas
        if (
          errorMessage.includes("Duplicate entry") &&
          errorMessage.includes("ip_address_unique")
        ) {
          errorMessage =
            "IP address already used by another router. Please use a different IP.";
          // Update ipValidation state untuk UI
          setIpValidation({
            checking: false,
            available: false,
            message: "IP sudah digunakan",
          });
          setError("ip_address", {
            type: "manual",
            message: "IP address already used by another router",
          });
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Tampilkan toast error
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Router Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Router Name *
        </label>
        <input
          type="text"
          {...register("name", { required: "Router name is required" })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Main Office Router"
          disabled={loading}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* IP Address dengan Validasi Real-time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          IP Address *
        </label>
        <input
          type="text"
          {...register("ip_address", {
            required: "IP address is required",
            pattern: {
              value: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
              message: "Invalid IP address format (e.g., 192.168.1.1)",
            },
            validate: (value) => {
              if (ipValidation.available === false) {
                return "IP address already used by another router";
              }
              return true;
            },
          })}
          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
            errors.ip_address || ipValidation.available === false
              ? "border-red-300 focus:ring-red-500"
              : ipValidation.available === true
              ? "border-green-300 focus:ring-green-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
          placeholder="192.168.1.1"
          disabled={loading}
        />

        {/* Validation Status */}
        <div className="mt-2">
          {ipValidation.checking && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{ipValidation.message}</span>
            </div>
          )}

          {ipValidation.available === true && !errors.ip_address && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>{ipValidation.message}</span>
            </div>
          )}

          {ipValidation.available === false && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <XCircle className="w-4 h-4" />
              <span>{ipValidation.message}</span>
            </div>
          )}

          {errors.ip_address && (
            <p className="text-red-500 text-sm mt-1">
              {errors.ip_address.message}
            </p>
          )}
        </div>
      </div>

      {/* Ports */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Port *
          </label>
          <input
            type="number"
            {...register("port", {
              required: "Port is required",
              min: { value: 1, message: "Minimum port is 1" },
              max: { value: 65535, message: "Maximum port is 65535" },
            })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="8728"
            disabled={loading}
          />
          {errors.port && (
            <p className="text-red-500 text-sm mt-1">{errors.port.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Port *
          </label>
          <input
            type="number"
            {...register("api_port", {
              required: "API port is required",
              min: { value: 1, message: "Minimum port is 1" },
              max: { value: 65535, message: "Maximum port is 65535" },
            })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="8728"
            disabled={loading}
          />
          {errors.api_port && (
            <p className="text-red-500 text-sm mt-1">
              {errors.api_port.message}
            </p>
          )}
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username *
        </label>
        <input
          type="text"
          {...register("username", { required: "Username is required" })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="admin"
          disabled={loading}
        />
        {errors.username && (
          <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password {router ? "(leave empty to keep current)" : "*"}
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            {...register(
              "password",
              router
                ? {
                    validate: (value) => {
                      // Password optional untuk update, tapi jika diisi minimal 3 karakter
                      if (value && value.trim() !== "" && value.length < 3) {
                        return "Password must be at least 3 characters";
                      }
                      return true;
                    },
                  }
                : {
                    required: "Password is required",
                    minLength: { value: 3, message: "Minimum 3 characters" },
                  }
            )}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={router ? "•••••••• (keep current)" : "••••••••"}
            autoComplete="new-password"
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
        {router && (
          <p className="text-xs text-gray-500 mt-1">
            Only fill if you want to change the password
          </p>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          {...register("status")}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            loading || errors.ip_address || ipValidation.available === false
          }
          className="min-w-[120px]"
        >
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
              Saving...
            </span>
          ) : router ? (
            "Update Router"
          ) : (
            "Create Router"
          )}
        </Button>
      </div>
    </form>
  );
}
