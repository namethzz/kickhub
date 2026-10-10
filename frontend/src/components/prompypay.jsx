// import { React, useState } from "react";
import promptpaylogo from "../../public/prompt-pay-logo.svg";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import Qrcode from "../../public/googleQRcodes.png";

export default function Promptpay() {
  const dummydata = {
    referenceNumber: "123456",
    amount: "700",
    telaphoneNumber: "012-345-6789",
    fieldName: "สนามฟุตบอลศรีปทุม",
  };

  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-md max-w-md mx-auto mt-10 font-noto-thai flex flex-col items-center">
      <div className="relative flex items-center justify-between w-full p-4">
        <FaArrowLeft
          className="text-[1rem] font-bold cursor-pointer "
          onClick={() => navigate(-1)}
        />
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold">
          QR PromptPay
        </h1>
      </div>
      <div className="bg-green-300 p-4 mt-4 w-full flex flex-col items-center">
        <p>บันทึก QR Code นี้และนำไปสแกนผ่านแอปธนาคาร</p>
      </div>
      <div className="bg-gray-200 p-4 w-full grid grid-cols-2 justify-between">
        <p>เลขที่อ้างอิง</p>
        <p className="place-self-end">{dummydata.referenceNumber}</p>
        <p>จำนวนเงินที่ต้องชำระ</p>
        <p className="place-self-end">{dummydata.amount}</p>
      </div>
      <div className="flex flex-col items-center w-[17rem]">
        <img
          src={promptpaylogo}
          alt="PromptPay QR Code"
          className="mt-4 mb-4"
        />
        <img src={Qrcode} alt="QR Code for Payment" className="w-full mb-4" />
      </div>
      <div className="flex flex-col items-center">
        <p>หมายเลขพร้อมเพย์</p>
        <p className="font-bold">{dummydata.telaphoneNumber}</p>
        <p>{dummydata.amount} บาท</p>
        <p>{dummydata.fieldName}</p>
      </div>
      <div className="flex flex-col items-center w-[10rem]">
        <button className="bg-green-200 text-black w-full p-3 rounded-lg mt-4 mb-4 hover:bg-green-300 border border-green-400 cursor-pointer">
          บันทึก QR Code
        </button>
      </div>
    </div>
  );
}
