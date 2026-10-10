// OwnerFieldManager.jsx
import React, { useEffect, useRef, useState } from "react";
import { FaMapMarkerAlt, FaClock, FaInfoCircle } from "react-icons/fa";
import styled from "styled-components";
import OwnerField from "../../public/สนามของเรา.png";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function OwnerFieldManager() {
  const [fields, setFields] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailField, setDetailField] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    mapLink: "",
    price: "",
    openTime: "",
    closeTime: "",
    fieldType: "หญ้าเทียม",
    promptPay: "",
    amenities: [],
    description: "",
    image: null,
  });

  const [amenitiesState, setAmenitiesState] = useState({
    ห้องน้ำ: false,
    ที่จอดรถ: false,
    ร้านค้า: false,
    "wifi free": false,
  });

  // 🕒 ฟังก์ชันจัดรูปแบบเวลาให้สวยและสม่ำเสมอ
  const formatTime = (time) => {
    if (!time) return "-";
    if (typeof time === "number") {
      // ถ้าเป็น 1000 หรือ 2300 ให้แปลงเป็น "10:00" "23:00"
      const str = time.toString().padStart(4, "0");
      return `${str.slice(0, 2)}:${str.slice(2, 4)}`;
    }
    if (typeof time === "string") {
      // ถ้ามีรูปแบบเช่น "10", "1000", "10:00"
      const clean = time.replace(/\D/g, "");
      if (clean.length === 4)
        return `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
      if (clean.length === 2) return `${clean}:00`;
      return time;
    }
    return time;
  };

  const fileInputRef = useRef(null);
  const amenitiesList = ["ห้องน้ำ", "ที่จอดรถ", "ร้านค้า", "wifi free"];

  const token = localStorage.getItem("token"); // ✅ ต้องมี token จากการ login
  const fetchFields = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/owner-fields`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("โหลดสนามไม่ได้ กรุณาตรวจสอบบัญชีเจ้าของสนาม");
      const data = await res.json();
      setFields(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching fields:", err);
    }
  };

  // 🧩 โหลดสนามทั้งหมดของเจ้าของเมื่อเปิดหน้า
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;
    fetch(`${API_BASE}/api/owner-fields`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => { if (!res.ok) throw new Error("บัญชีไม่มีสิทธิ์ดูสนาม"); return res.json(); })
      .then((data) => setFields(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching fields:", err));
  }, [token]);

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      mapLink: "",
      price: "",
      openTime: "",
      closeTime: "",
      fieldType: "หญ้าเทียม",
      promptPay: "",
      amenities: [],
      description: "",
      image: null,
    });
    setIsEditing(false);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleAmenityToggle = (item) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(item)
        ? prev.amenities.filter((a) => a !== item)
        : [...prev.amenities, item],
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image: url }));
  };

  // ➕ เพิ่ม หรือ ✏️ แก้ไข สนาม
  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = {
      field_name: formData.name,
      field_type: formData.fieldType,
      mobile_number: formData.promptPay,
      address: formData.address,
      price: formData.price,
      open: formData.openTime,
      close: formData.closeTime,
      facilities: formData.amenities,
      image: formData.image,
      description: formData.description,
      google_map: formData.mapLink,
    };

    try {
      if (isEditing && editingId) {
        // ✏️ update field
        const res = await fetch(`${API_BASE}/api/update-fields/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("แก้ไขสนามไม่ได้");
        const updated = await res.json();

        // ✅ ถ้ามีข้อมูล field กลับมา
        if (updated && updated._id) {
          setFields((prev) =>
            prev.map((f) => (f._id === editingId ? updated : f))
          );
        } else {
          await fetchFields();
        }
      } else {
        // ➕ add field
        const res = await fetch(`${API_BASE}/api/add-fields`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("เพิ่มสนามไม่ได้ กรุณาตรวจสอบข้อมูลและสิทธิ์บัญชี");
        const added = await res.json();
        if (added && added._id) {
          setFields((prev) => [added, ...prev]);
        } else {
          await fetchFields();
        }
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (field) => {
    setFormData({
      name: field.field_name,
      address: field.address,
      mapLink: field.google_map,
      price: field.price,
      openTime: field.open,
      closeTime: field.close,
      fieldType: field.field_type,
      promptPay: field.mobile_number,
      amenities: Array.isArray(field.facilities)
        ? field.facilities
        : Object.values(field.facilities || {}),
      description: field.description,
      image: field.image,
    });
    setIsEditing(true);
    setEditingId(field._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ❌ ลบสนาม
  const confirmDeleteNow = async () => {
    try {
      await fetch(`${API_BASE}/api/delete-fields/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFields((prev) => prev.filter((f) => f._id !== confirmDelete.id));
    } catch (err) {
      console.error("Error deleting field:", err);
    }
    setConfirmDelete({ show: false, id: null });
  };

  const openDetail = (field) => {
    setDetailField(field);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🎨 สไตล์ upload box
  const StyledWrapper = styled.div`
    .custum-file-upload {
      width: 100%;
      height: 200px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      border: 2px dashed #e2e8f0;
      background-color: #ffffff;
      padding: 1rem;
      border-radius: 10px;
      overflow: hidden;
    }
    .custum-file-upload .icon svg {
      height: 64px;
      fill: rgba(75, 85, 99, 1);
    }
    .custum-file-upload .text span {
      font-weight: 400;
      color: rgba(75, 85, 99, 1);
    }
    .custum-file-upload input {
      display: none;
    }
  `;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pb-10">
      {/* header */}
      <div className="relative w-[24.5rem] h-[10rem]">
        <img
          src={OwnerField}
          alt="OwnerField"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative bg-[#F2F2F7] rounded-t-3xl w-[24.5rem] p-5 -mt-4 flex-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800">จัดการสนาม</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold rounded-lg px-4 py-2 shadow transition"
          >
            + เพิ่มสนามใหม่
          </button>
        </div>

        {/* ไม่มีสนาม */}
        {fields.length === 0 && !showForm && (
          <div className="border border-gray-300 rounded-xl text-center text-gray-500 p-8">
            <p className="mb-1">ยังไม่มีสนามในระบบ</p>
            <p className="text-sm">เริ่มต้นด้วยการเพิ่มสนามใหม่</p>
          </div>
        )}

        {/* ฟอร์มเพิ่ม/แก้ไข */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            <input
              type="text"
              placeholder="ชื่อสนาม"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border rounded-lg p-2"
              required
            />

            <input
              type="text"
              placeholder="ที่ตั้ง/สถานที่"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full border rounded-lg p-2"
              required
            />

            <input
              type="text"
              placeholder="ลิงก์ Google Map"
              value={formData.mapLink}
              onChange={(e) =>
                setFormData({ ...formData, mapLink: e.target.value })
              }
              className="w-full border rounded-lg p-2"
              required
            />

            <input
              type="text"
              placeholder="ราคา/ชม."
              value={formData.price}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value))
                  setFormData({ ...formData, price: value });
              }}
              className="w-full border rounded-lg p-2"
              required
            />

            <div className="flex gap-2">
              <div className="flex items-center border rounded-lg p-2 w-1/2">
                <FaClock className="text-gray-500 mr-2" />
                <input
                  type="time"
                  value={formData.openTime}
                  onChange={(e) =>
                    setFormData({ ...formData, openTime: e.target.value })
                  }
                  className="w-full bg-transparent outline-none"
                />
              </div>
              <div className="flex items-center border rounded-lg p-2 w-1/2">
                <FaClock className="text-gray-500 mr-2" />
                <input
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) =>
                    setFormData({ ...formData, closeTime: e.target.value })
                  }
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            <select
              value={formData.fieldType}
              onChange={(e) =>
                setFormData({ ...formData, fieldType: e.target.value })
              }
              className="w-full border rounded-lg p-2"
            >
              <option value="หญ้าเทียม">หญ้าเทียม</option>
              <option value="หญ้าแท้">หญ้าแท้</option>
            </select>

            <input
              type="text"
              placeholder="หมายเลขพร้อมเพย์"
              value={formData.promptPay}
              onChange={(e) =>
                setFormData({ ...formData, promptPay: e.target.value })
              }
              className="w-full border rounded-lg p-2"
            />

            {/* สิ่งอำนวยความสะดวก */}
            <div>
              <p className="text-gray-700 font-medium mb-2">
                สิ่งอำนวยความสะดวก
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(amenitiesState).map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => {
                      // toggle true/false ใน amenitiesState
                      setAmenitiesState((prev) => ({
                        ...prev,
                        [item]: !prev[item],
                      }));

                      // update formData.amenities สำหรับส่ง backend
                      setFormData((prev) => ({
                        ...prev,
                        amenities: prev.amenities.includes(item)
                          ? prev.amenities.filter((a) => a !== item)
                          : [...prev.amenities, item],
                      }));
                    }}
                    className={`px-3 py-1 rounded-full border text-sm ${
                      amenitiesState[item]
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "border-gray-300 text-gray-600"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="รายละเอียดเพิ่มเติม"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border rounded-lg p-2 min-h-[100px]"
            />

            <div className="mt-1">
              <label className="block text-xs text-gray-600 mb-2">
                รูปสนาม
              </label>
              <StyledWrapper>
                <label className="custum-file-upload relative" htmlFor="file">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="preview"
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <div className="icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M10 1C9.7 1 9.48 1.1 9.29 1.29L3.29 7.29C3.1 7.48 3 7.73 3 8V20C3 21.65 4.34 23 6 23H7C7.55 23 8 22.55 8 22C8 21.45 7.55 21 7 21H6C5.45 21 5 20.55 5 20V9H10C10.55 9 11 8.55 11 8V3H18C18.55 3 19 3.45 19 4V9C19 9.55 19.45 10 20 10C20.55 10 21 9.55 21 9V4C21 2.34 19.66 1 18 1H10Z"
                            fill="#4B5563"
                          />
                        </svg>
                      </div>
                      <div className="text">
                        <span>Click to upload image</span>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </StyledWrapper>
            </div>

            <div className="flex gap-3 mt-4 pb-6">
              <button
                type="submit"
                className="flex-1 bg-emerald-500 text-white py-2 rounded-lg font-semibold"
              >
                {isEditing ? "บันทึกการแก้ไข" : "เพิ่มสนาม"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}

        {/* รายการสนาม */}
        {fields.length > 0 && !showForm && (
          <div className="mt-4 space-y-4">
            {fields.map((f) => (
              <div
                key={f._id}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
              >
                <div className="w-full h-36 bg-gray-100">
                  {f.image ? (
                    <img
                      src={f.image}
                      alt={f.field_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      ไม่มีรูป
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {f.field_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <FaMapMarkerAlt className="text-emerald-500" />
                        {f.address}
                      </p>
                      <p className="text-sm text-emerald-600 font-semibold mt-1">
                        ฿{f.price}/ชม.
                      </p>
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-1 flex items-center gap-1">
                      <FaClock className="text-emerald-500" />
                      <span>
                        {f.open} - {f.close}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(f)}
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg transition"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDelete({ show: true, id: f._id })
                        }
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-600 text-sm font-medium rounded-lg transition"
                      >
                        ลบ
                      </button>
                    </div>
                    <button
                      onClick={() => openDetail(f)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition"
                    >
                      <FaInfoCircle className="text-sm" /> รายละเอียด
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal รายละเอียด */}
      {detailField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl overflow-auto max-h-[90vh]">
            <div className="mb-3 flex justify-between items-start">
              <h2 className="text-lg font-semibold">
                {detailField.field_name}
              </h2>
              <button
                onClick={() => setDetailField(null)}
                className="text-gray-500"
              >
                ปิด
              </button>
            </div>

            {detailField.image && (
              <img
                src={detailField.image}
                alt={detailField.field_name}
                className="w-full h-36 object-cover rounded-lg mb-3"
              />
            )}

            <p className="text-sm text-slate-600 mb-2">
              <strong>ประเภทสนาม:</strong> {detailField.field_type}
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <strong>ราคา:</strong> ฿{detailField.price}/ชม.
            </p>
            <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">
              <FaClock />
              {formatTime(detailField.open)} - {formatTime(detailField.close)}
            </p>

            <p className="text-sm text-slate-600 mb-2">
              <strong>พร้อมเพย์:</strong> {detailField.mobile_number || "-"}
            </p>
            <p className="text-sm text-emerald-600 mb-2">
              <a
                href={detailField.google_map}
                target="_blank"
                rel="noreferrer"
                className="underline flex items-center gap-2"
              >
                <FaMapMarkerAlt /> เปิดใน Google Maps
              </a>
            </p>

            {detailField.facilities && (
              <div className="mb-3">
                <strong className="text-sm text-slate-700">
                  สิ่งอำนวยความสะดวก:
                </strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.isArray(detailField.facilities)
                    ? detailField.facilities.map((a) => (
                        <span
                          key={a}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs border border-emerald-200"
                        >
                          {a}
                        </span>
                      ))
                    : Object.entries(detailField.facilities)
                        .filter(([_, v]) => v) // แสดงเฉพาะที่เป็น true
                        .map(([key]) => {
                          // ✅ แปลงชื่อ key อังกฤษ -> ไทย
                          const translate = {
                            lights: "ไฟส่องสว่าง",
                            parking: "ที่จอดรถ",
                            restroom: "ห้องน้ำ",
                            shop: "ร้านค้า",
                            wifi: "Wi-Fi ฟรี",
                            aircon: "ห้องปรับอากาศ",
                          };
                          const label = translate[key] || key; // ถ้าไม่มีใน dict ให้ใช้ key เดิม
                          return (
                            <span
                              key={key}
                              className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs border border-emerald-200"
                            >
                              {label}
                            </span>
                          );
                        })}
                </div>
              </div>
            )}

            {detailField.description && (
              <div className="mb-3">
                <strong className="text-sm text-slate-700">รายละเอียด:</strong>
                <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">
                  {detailField.description}
                </p>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => setDetailField(null)}
                className="w-full bg-emerald-500 text-white py-2 rounded-lg"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ยืนยันลบ */}
      {confirmDelete.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="mb-3">ยืนยันการลบสนามนี้หรือไม่?</p>
            <div className="flex gap-2">
              <button
                onClick={confirmDeleteNow}
                className="bg-rose-500 text-white px-3 py-1 rounded"
              >
                ลบ
              </button>
              <button
                onClick={() => setConfirmDelete({ show: false, id: null })}
                className="border px-3 py-1 rounded"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}