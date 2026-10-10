import React, { useState } from "react";
import { FaMapMarkerAlt, FaClock, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import findparty from "../../public/party2.png";
import teamImg from "../../public/team.png";
import BottomNav from "./Navbar";
import team from "../../public/team.png";
import LP from "../../public/lockposition.png";
import Buffetpic from "../../public/buffetpic.png";

const CreateParty = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("บุฟเฟ่ต์");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState("");
  const [price, setPrice] = useState("");
  const [partyname, setPartyname] = useState("");
  const [playername, setPlayername] = useState("");
  const [detail, setDetail] = useState("");
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0]; // ดึงไฟล์แรก
    if (file) setImage(file); // เก็บลง state
  };
  const handleCreate = () => {
    console.log("เวลา:", time);
    console.log("จำนวนชั่วโมง:", hours);
    console.log("ราคา:", price);
    console.log("ชื่อรายทีม:", partyname);
    console.log("ชื่อผู้เล่น:", playername);
    console.log("รายละเอียด:", detail);

    alert(
      `สร้างรายการ:\nเวลา: ${time}\nชั่วโมง: ${hours}\nราคา: ${price} บาท\nชื่อรายทีม: ${partyname}\nชื่อผู้เล่น: ${playername}\nรายละเอียด: ${detail}`
    );
  };

  return (
    <div className="font-noto-thai">
      <div className="flex flex-col items-center pb-20">
        {/* HEADER */}
        <div className="relative w-[24.5rem] h-[10rem]">
          {/* ปุ่มย้อนกลับ */}
          <button
            onClick={() => navigate("/team")}
            className="absolute top-4 left-4 bg-white p-2 rounded-full shadow hover:bg-gray-100 transition"
          >
            <FaArrowLeft className="text-green-600 text-lg" />
          </button>

          {/* กล่องค้นหา */}
          <div className="absolute top-5 left-36 z-10">
            <form className="flex items-center bg-white rounded-full shadow-sm px-3 py-2 w-[200px]">
              <button type="button" className="text-gray-400">
                <svg
                  width={17}
                  height={16}
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.667 12.667A5.333 5.333 0 107.667 2a5.333 5.333 0 000 10.667zM14.334 14l-2.9-2.9"
                    stroke="currentColor"
                    strokeWidth="1.333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <input
                className="flex-1 px-2 py-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
                placeholder="ค้นหาสนามบอล"
                required
                type="text"
              />
            </form>
          </div>

          <img
            src={findparty}
            alt="findparty"
            className="w-full h-full object-cover"
          />
        </div>

        {/* BODY */}
        <div className="relative bg-[#F2F2F7] rounded-t-2xl w-[24.5rem] h-[100.5rem] p-5 overflow-y-auto absolute bottom-10">
          {/* ชื่อสนาม */}
          <h2 className="text-black font-bold text-xl mb-2">สนามฟุตบอล</h2>
          <p className="text-gray-600 mb-3 text-sm">สนามไรมง</p>

          {/* โหมด */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                เลือกโหมด:
              </span>
              <select
                className="bg-green-100 text-green-700 font-semibold rounded-lg px-3 py-1 text-sm"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="บุฟเฟ่ต์">บุฟเฟ่ต์</option>
                <option value="ล็อคตำแหน่ง">ล็อคตำแหน่ง</option>
              </select>
            </div>

            <input
              type="date"
              className="bg-green-100 text-green-700 rounded-lg px-3 py-1 text-sm font-semibold"
              defaultValue="2025-10-22"
            />
          </div>

          {/* ปุ่มค้นหา / สร้าง */}
          <div className="flex justify-between mb-4">
            <button
              onClick={() => navigate("/Findandcreate")}
              className="border border-green-500 text-green-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-100"
            >
              ค้นหาปาร์ตี้
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow hover:bg-green-600">
              สร้างปาร์ตี้
            </button>
          </div>

          {/* สร้างปาร์ตี้ */}
          <div>
            <h1 className="text-2xl p-2 ">โหมด</h1>
          </div>

          <div className="flex justify-center gap-4">
            <div
              o
              className="bg-green-100 border border-gray-500 rounded-lg p-1 w-42 h-43 flex flex-col items-center justify-center flex flex-col "
            >
              <img
                src={Buffetpic}
                alt=""
                className="max-w-full max-h-3/4 object-contain"
              />
              <p className="mt-1 text-center">บุฟเฟ่ต์</p>
            </div>

            <div>
              <div
               onClick={() => navigate("/create-party2")}
              className="bg-white border border-gray-500 rounded-lg p-1 w-42 h-43 flex flex-col items-center justify-center flex flex-col ">
                
                <img
                  src={LP}
                  alt=""
                  className="w-78 max-h-3/4 object-contain absolute mb-4"
                />
                <p className="mt-24 text-center">ล็อคตำแหน่ง</p>
              </div>
            </div>
          </div>

          {/* รายการ */}

          <div className="p-2">
            <h1 className="l pt-2 pr-2 pb-2 ">เวลา</h1>
            <div className="w-full h-10">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg w-86 h-10 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder="เวลา"
              />
            </div>

            <div className="">
              <div className="flex flew-row gap-17">
                <h1 className=" pt-2 pr-2 pb-2">จํานวนชั่วโมง</h1>
                <h1 className=" p-2 ">ราคา (บาท/คน)</h1>
              </div>
            </div>
            <div className="flex flew-row gap-3">
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg p-1 pl-2 rounded w-38 h-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder="ชั่วโมง"
              />

              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg p-1  pl-2 rounded w-43 h-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder="ราคา"
              />
            </div>

            <div>
              <div className="">
                <div className="flex flew-row gap-25">
                  <h1 className=" pt-2 pr-2 pb-2">ชื่อปาร์ตี้</h1>
                  <h1 className=" p-2 ">จำนวนผู้เล่น</h1>
                </div>
              </div>
              <div className="flex flew-row gap-3">
                <input
                  type="text"
                  value={partyname}
                  onChange={(e) => setPartyname(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg p-1  pl-2 rounded w-38 h-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="ชื่อปาร์ตี้"
                />

                <input
                  type="number"
                  value={playername}
                  onChange={(e) => setPlayername(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg p-1  pl-2 rounded w-43 h-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="จำนวนผู้เล่น"
                />
              </div>
            </div>
            <div>
              <h1 className=" pt-2 pr-2 pb-2">รายละเอียด</h1>
            </div>
            <div>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={200} // จำกัดไม่เกิน 200 ตัวอักษร
                className="border border-gray-300 p-2 rounded-lg w-86 h-30 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
                placeholder="รายละเอียด (ไม่เกิน 200 ตัวอักษร)"
              />
            </div>
            <div>
              <h1 className=" pt-2 pr-2 pb-2">รูปภาพปก</h1>
            </div>
            <div>
              <div className="flex flex-col">
                <label
                  htmlFor="fileInput"
                  className="bg-white text-green-500 border-green-500 border border-gray-300 rounded-lg p-2 w-43 h-10 text-sm text-gray-400 flex items-center cursor-pointer hover:bg-gray-100"
                >
                  {image ? image.name : "เลือกรูปภาพ"} {/* แสดงชื่อไฟล์ถ้ามี */}
                </label>

                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="hidden" // ซ่อน input จริง
                />

                {/* preview รูป */}
                {image && (
                  <img
                    src={URL.createObjectURL(image)}
                    alt="preview"
                    className="h-32 mt-2 rounded"
                  />
                )}
              </div>
            </div>
            <div>
              <h1 className=" pt-3 pr-2 pb-2">รูปเเบบการเก็บเงิน</h1>
            </div>
            <div className="flex flew-row gap-3">
              <button className="active:bg-green-100 active:text-green-600 bg-white text-green-500 border-green-500 border border-gray-300 rounded-lg p-4 w-20 text-center h-10 text-sm text-gray-400 flex items-center cursor-pointer hover:bg-gray-100">
                บุฟเฟ่ต์
              </button>
              <button className="active:bg-green-100 active:text-green-600 bg-white text-green-500 border-green-500 border border-gray-300 rounded-lg p-4 w-20 text-center h-10 text-sm text-gray-400 flex items-center cursor-pointer hover:bg-gray-100">
                หารเท่า
              </button>
            </div>

            <div className="pt-10">
              <button
                onClick={handleCreate}
                className="bg-green-500 text-white text-xl border-green-500 border rounded-lg p-4 w-86 h-10 flex items-center justify-center cursor-pointer hover:bg-green-600 active:scale-95 transition"
              >
                สร้าง
              </button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
};

export default CreateParty;

{
  /* <div>
                    <div className="">
      <h2 className="text-xl font-bold text-center">สร้างรายการ</h2>

      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="border p-2 w-full rounded"
        placeholder="เวลา"
      />

      <input
        type="number"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        className="border p-2 w-full rounded"
        placeholder="จำนวนชั่วโมง"
      />

      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="border p-2 w-full rounded"
        placeholder="ราคา"
      />

      <button
        onClick={handleCreate}
        className="bg-blue-500 text-white w-full p-2 rounded hover:bg-blue-600 transition"
      >
        สร้าง
      </button>
    </div>
           </div> */
}
