import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuScanQrCode } from "react-icons/lu";
import { FaMapMarkerAlt, FaRegCreditCard, FaMoneyBill } from "react-icons/fa";
import field from "../../public/field.jpg";
import googlemap from "../../public/Google_Maps_icon_(2015-2020).svg.png";

// 📦 ข้อมูลจำลอง
const FIELD_DATA = {
  name: "สนามฟุตบอลศรีปทุม",
  type: "หญ้าเทียม",
  location: "2410/2 ถ. พหลโยธิน แขวงเสนานิคม เขตจตุจักร กรุงเทพมหานคร 10900",
  googlemapLink: "https://maps.app.goo.gl/oKR8s7gfsfGVqKPs8",
  details: [
    "ขนาดสนาม: 5 คน",
    "อุปกรณ์ที่มีให้: ประตูฟุตบอล, ลูกฟุตบอล",
    "สิ่งอำนวยความสะดวก: ห้องเปลี่ยนเสื้อผ้า, ที่จอดรถ",
    "กฎระเบียบ: ห้ามสูบบุหรี่ในสนาม, ห้ามนำสัตว์เลี้ยงเข้า",
  ],
  price: 700,
};

const RESERVE_DATE = { day: 22, month: 10, year: 2024 };
const TIME_START = "18:00";
const TIME_END = "19:00";

// 🕒 Utility functions
const formatDate = ({ day, month, year }) =>
  `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;

const getDurationInHours = (start, end) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const total = eh * 60 + em - (sh * 60 + sm);
  return Math.floor(total / 60);
};

const calculateTotal = () =>
  getDurationInHours(TIME_START, TIME_END) * FIELD_DATA.price;

const paymentMethods = [
  {
    id: "promptpay",
    label: "พร้อมเพย์",
    icon: LuScanQrCode,
    border: "border-yellow-600",
    active: "bg-yellow-400 text-gray-800",
    inactive: "bg-yellow-100 hover:bg-yellow-300",
  },
  {
    id: "card",
    label: "ตัดบัญชีธนาคาร",
    icon: FaRegCreditCard,
    border: "border-blue-600",
    active: "bg-blue-400 text-gray-800",
    inactive: "bg-blue-100 hover:bg-blue-300",
  },
  {
    id: "cash",
    label: "เงินสด",
    icon: FaMoneyBill,
    border: "border-green-600",
    active: "bg-green-400 text-gray-800",
    inactive: "bg-green-100 hover:bg-green-300",
  },
];

export default function Reserve() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const handleClick = () => {
    if (selected === null) {
      alert("กรุณาเลือกวิธีการชําระเงิน");
    }
    if (selected === "promptpay") {
      navigate("/promptpay");
    }
    if (selected === "card") {
      alert(
        "ขออภัย การชําระเงินด้วยบัญชีธนาคารยังไม่รองรับ กรุณาเลือกวิธีการชําระเงินอื่น"
      );
    }
    if (selected === "cash") {
      alert(
        "ขออภัย การชําระเงินด้วยเงินสดยังไม่รองรับ กรุณาเลือกวิธีการชําระเงินอื่น"
      );
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-md rounded-t-2xl overflow-hidden">
        <img
          src={field}
          alt="สนามฟุตบอล"
          className="w-full h-48 object-cover"
        />

        <div className="p-4">
          {/* ชื่อสนาม */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-noto-thai text-2xl font-bold">
                {FIELD_DATA.name}
              </h1>
              <p className="font-noto-thai text-gray-700">
                ประเภทสนาม: {FIELD_DATA.type}
              </p>
            </div>
            <a
              href={FIELD_DATA.googlemapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center"
            >
              <img src={googlemap} alt="Google Map" className="w-16 h-auto" />
              <p className="font-noto-thai text-xs text-center text-blue-600">
                เปิดบน Google Maps
              </p>
            </a>
          </div>

          {/* รายละเอียดการจอง */}
          <div className="mt-4 border-t pt-4 font-noto-thai">
            <h2 className="font-bold text-lg mb-2">รายละเอียดการจอง</h2>

            <div className="flex justify-between mt-2">
              <p>พิกัดสถานที่</p>
              <div className="flex text-gray-600">
                <FaMapMarkerAlt className="text-green-600 mr-1" />
                <span className="truncate max-w-[10rem]">
                  {FIELD_DATA.location}
                </span>
              </div>
            </div>

            <div className="flex justify-between mt-2">
              <p>วันที่</p>
              <p>{formatDate(RESERVE_DATE)}</p>
            </div>

            <div className="flex justify-between mt-2">
              <p>เวลา</p>
              <p>
                {TIME_START} - {TIME_END} (
                {getDurationInHours(TIME_START, TIME_END)} ชั่วโมง)
              </p>
            </div>

            <div className="mt-2">
              <p className="font-bold">รายละเอียดเพิ่มเติม</p>
              <ul className="list-disc pl-5 text-gray-700">
                {FIELD_DATA.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>

            {/* ช่องทางการชำระเงิน */}
            <div className="mt-4 border-t pt-4">
              <p className="font-bold mb-2">ช่องทางการชำระเงิน</p>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isActive = selected === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelected(method.id)}
                      className={`transition-all duration-200 py-3 px-2 rounded-lg border ${
                        method.border
                      } flex flex-col items-center text-sm ${
                        isActive ? method.active : method.inactive
                      }`}
                    >
                      <Icon className="w-6 h-6 mb-1" />
                      {method.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-blue-200 text-blue-800 grid grid-cols-2  mt-5 py-2 px-4 rounded-lg">
              <p>ราคาค่าเช่าสนามต่อชั่วโมง</p>
              <p className="font-bold place-self-end">
                {" "}
                {FIELD_DATA.price} บาท
              </p>
              <p>ยอดชำระรวม</p>
              <p className="font-bold text-red-600 place-self-end">
                {" "}
                {calculateTotal()} บาท
              </p>
            </div>
            <div className="bg-red-200 text-red-800 mt-4 py-2 px-4 rounded-lg">
              <p>ไม่สามารถยกเลิกการจองได้</p>
            </div>
            <div className="mt-4">
              <button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-full transition-colors duration-200"
                onClick={handleClick}
              >
                ยืนยันการจอง
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
