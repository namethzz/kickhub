import { FaArrowLeft, FaRegUser, FaMapMarkerAlt } from "react-icons/fa";
import { FaCircleUser } from "react-icons/fa6";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import googlemap from "../../public/Google_Maps_icon_(2020).png";
import photo from "../../public/field.jpg";
import goalkeeper from "../../public/ประตู.png";
import forward from "../../public/กองหน้า.png";
import midfielder from "../../public/กองกลาง.png";
import defender from "../../public/กองหลัง.png";

export default function PartyRole() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("info");
  const [selectedPos, setSelectedPos] = useState(null);
  const [reservedPos, setReservedPos] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postData, setPostData] = useState(null);
  const [status, setStatus] = useState("waiting");
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const getUserIdFromToken = (token) => {
    if (!token) return null;
    try {
      const payloadBase64 = token.split(".")[1];
      const decodedPayload = atob(payloadBase64);
      const payload = JSON.parse(decodedPayload);
      return payload._id || payload.user_id || payload.id || null;
    } catch (err) {
      console.error("❌ Token decode error:", err);
      return null;
    }
  };

  const fetchPost = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://192.168.1.26:3000/api/post/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        const data = result.data;
        setPostData(data);

        // ✅ ตรวจสอบว่าผู้ใช้เคยจองตำแหน่งไว้ก่อนแล้วหรือไม่
        const userId = getUserIdFromToken(token);
        const myJoin = data.participants.find((p) => p.user_id === userId);
        setReservedPos(myJoin ? myJoin.position : null);
      } else {
        setError("ไม่พบข้อมูล");
      }

      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost(id);
  }, [id]);

  useEffect(() => {
    console.log("data:", postData);
  }, [postData]);

  const convertDateThai = (dateString) => {
    const date = new Date(dateString);
    const daysThai = [
      "อาทิตย์",
      "จันทร์",
      "อังคาร",
      "พุธ",
      "พฤหัสบดี",
      "ศุกร์",
      "เสาร์",
    ];
    const monthsThai = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];
    return `วัน${daysThai[date.getDay()]}, ${date.getDate()} ${
      monthsThai[date.getMonth()]
    }`;
  };

  const progress = (current, total) => (current / total) * 100;

  const positionLabels = {
    FW: "กองหน้า",
    MF: "กองกลาง",
    GK: "ผู้รักษาประตู",
    DF: "กองหลัง",
  };

  const userId = getUserIdFromToken(token);

  const counts =
    postData?.participants?.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1;
      return acc;
    }, {}) || {};

  const alreadyJoined = postData?.participants?.some(
    (p) => p.user_id === userId
  );

  const displayedCounts = { ...counts };

  if (!alreadyJoined && reservedPos) {
    displayedCounts[reservedPos] = (displayedCounts[reservedPos] || 0) + 1;
  }

  console.log("✅ displayedCounts:", displayedCounts);

  const total = postData?.required_positions.reduce((acc, item) => {
    return acc + item.amount;
  }, 0);
  console.log("จำนวนผู้เล่นที่ต้องการทั้งหมด:", total);

  const getRequiredAmount = (positionCode) =>
    postData?.required_positions?.find((p) => p.position === positionCode)
      ?.amount || 0;

  const need = {
    FW: getRequiredAmount("FW"),
    MF: getRequiredAmount("MF"),
    DF: getRequiredAmount("DF"),
    GK: getRequiredAmount("GK"),
  };

  useEffect(() => {
    if (!postData?.start_datetime || !postData?.end_datetime) return;

    const startTime = new Date(postData.start_datetime);
    const endTime = new Date(postData.end_datetime);
    const now = new Date();

    if (now >= endTime) {
      setStatus("ended");
      return;
    } else if (now >= startTime) {
      setStatus("started");
    } else {
      setStatus("waiting");
    }

    const interval = setInterval(() => {
      const now = new Date();
      if (now >= endTime) {
        setStatus("ended");
        clearInterval(interval);
      } else if (now >= startTime) {
        setStatus("started");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [postData?.start_datetime, postData?.end_datetime]);

  useEffect(() => {
    console.log("Status changed:", status);
  }, [status]);

  const joinParty = async (postId, selectedPos) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://192.168.1.26:3000/api/join-party/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ position: selectedPos }), // ✅ ส่งตำแหน่ง
        }
      );

      const result = await response.json();
      if (response.ok) {
        console.log("✅ เข้าร่วมสำเร็จ:", result);
        fetchPost(postId);
      } else {
        console.error("❌ เข้าร่วมไม่สำเร็จ:", result.error);
      }
    } catch (err) {
      console.error("❌ Error joining party:", err);
    }
  };

  const leaveParty = async (postId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://192.168.1.26:3000/api/leave-party/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        console.log("✅ ออกจากปาร์ตี้สำเร็จ:", result);
        fetchPost(postId); // รีโหลดข้อมูลใหม่
      } else {
        console.error("❌ ออกจากปาร์ตี้ไม่สำเร็จ:", result.error);
      }
    } catch (err) {
      console.error("❌ Error leaving party:", err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!postData) return <p>ไม่พบข้อมูล</p>;

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl overflow-hidden font-noto-thai mt-6 mb-20">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b">
        <FaArrowLeft
          onClick={() => navigate(-1)}
          className="text-lg text-gray-600 cursor-pointer mr-3 hover:text-green-500"
        />
        <h1 className="font-bold text-lg">
          รายละเอียดปาร์ตี้ {postData.party_name}
        </h1>
      </div>

      {/* Cover */}
      <div className="relative">
        <img src={photo} alt="สนาม" className="w-full h-48 object-cover" />
        {status === "ended" && (
          <div className="absolute top-3 left-3 bg-red-500 px-3 py-1 rounded-full text-white text-sm flex items-center shadow-md transition-opacity duration-500 opacity-100">
            <p>การแข่งขันสิ้นสุดแล้ว</p>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-green-500 px-3 py-1 rounded-full text-white text-sm flex items-center shadow-md">
          <FaRegUser className="mr-2" />
          {postData.participants.length}/{total}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-50">
        {["info", "participants"].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`w-1/2 py-3 font-semibold transition-colors ${
              tab === key
                ? "text-green-600 border-b-2 border-green-500 bg-white"
                : "text-gray-500 hover:text-green-500"
            }`}
          >
            {key === "info" ? "รายละเอียด" : "ผู้เข้าร่วม"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {tab === "info" && (
          <>
            {/* Info Section */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold">{postData.field_name}</h2>
                <span className="text-green-600 font-bold">
                  {postData.price}฿ / คน
                </span>
              </div>

              <p className="flex items-center text-gray-600 mb-3">
                <FaMapMarkerAlt className="mr-1 text-green-500" />
                {postData.address}
              </p>

              <div className="grid grid-cols-2 text-sm text-gray-700 mb-4">
                <div>
                  <p className="text-gray-400">วัน/เวลา</p>
                  <p className="text-xs">
                    {convertDateThai(postData.start_datetime)}{" "}
                    <span className="text-red-500">*</span>{" "}
                    {new Date(postData.start_datetime).toLocaleTimeString(
                      "th-TH",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}{" "}
                    -{" "}
                    {new Date(postData.end_datetime).toLocaleTimeString(
                      "th-TH",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">หัวหน้าปาร์ตี้</p>
                  <p>{postData.host_name.split(" ")[0]}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <p className="text-gray-500 text-sm mb-1">ความคืบหน้า</p>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{
                    width: `${progress(postData.participants.length, total)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {postData.participants.length}/{total} คน
              </p>

              <div className="mt-4">
                <span className="flex items-center">
                  <h3 className="font-semibold text-green-600">
                    [ โหมด:{" "}
                    {postData.mode === "fixed" ? "ล็อคตําแหน่ง" : "ไม่ทราบ"} ]
                  </h3>
                  <h3 className="ml-2">{postData.party_name}</h3>
                </span>
                <p className="text-gray-700 mt-1 text-sm">
                  {postData.description}
                </p>
              </div>
            </div>

            {/* Position Booking */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "GK", label: "ผู้รักษาประตู", img: goalkeeper },
                { key: "FW", label: "กองหน้า", img: forward },
                { key: "MF", label: "กองกลาง", img: midfielder },
                { key: "DF", label: "กองหลัง", img: defender },
              ].map((pos) => {
                const isReserved = reservedPos === pos.key;
                const isLocked = reservedPos && !isReserved;

                const isFull = displayedCounts[pos.key] >= need[pos.key];
                return (
                  <div
                    key={pos.key}
                    className="bg-gray-50 p-3 rounded-xl shadow-sm text-center hover:shadow-md transition"
                  >
                    <img
                      src={pos.img}
                      alt={pos.label}
                      className="w-16 h-16 mx-auto mb-2"
                    />
                    <h1 className="font-bold mb-1">{pos.label}</h1>
                    <p className="text-gray-600 text-sm mb-2">
                      {displayedCounts[pos.key] || 0}/{need[pos.key]} คน
                    </p>
                    {isReserved ? (
                      <button
                        onClick={() => {
                          leaveParty(postData._id);
                        }}
                        disabled={status === "ended"}
                        className={`font-bold py-1.5 px-4 rounded-full w-full transition ${
                          status === "ended"
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600 text-white"
                        }`}
                      >
                        ยกเลิก
                      </button>
                    ) : isFull ? (
                      <button className="py-1.5 px-4 rounded-full w-full transition font-bold bg-gray-300 text-gray-600 cursor-not-allowed">
                        เต็มแล้ว
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedPos(pos.key);
                          setShowConfirm(true);
                        }}
                        disabled={isLocked || status === "ended"}
                        className={`font-bold py-1.5 px-4 rounded-full w-full transition ${
                          isLocked || status === "ended"
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                      >
                        จอง
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Map Button */}
            <a
              href={postData.google_map}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center mt-6 border border-green-500 text-green-600 py-2 rounded-full hover:bg-green-50 transition"
            >
              <img
                src={googlemap}
                alt="Google Maps"
                className="w-3 h-auto mr-2"
              />
              เปิดบน Google Maps
            </a>
          </>
        )}

        {tab === "participants" && (
          <div>
            <h3 className="font-bold mb-3">
              ผู้เข้าร่วมทั้งหมด ({postData.participants.length})
            </h3>
            <div className="max-h-[65vh] overflow-y-auto space-y-2">
              {postData.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center bg-gray-50 rounded-lg p-3 shadow-sm hover:shadow-md transition"
                >
                  <FaCircleUser className="text-4xl text-gray-400 mr-3" />
                  <div className="flex flex-col flex-1">
                    <p className="font-semibold">{p.name.split(" ")[0]}</p>
                    <span
                      className={`text-xs mt-1 w-fit px-2 py-0.5 rounded-full ${
                        p.position === "FW"
                          ? "bg-green-100 text-green-600"
                          : p.position === "GK"
                          ? "bg-red-100 text-red-600"
                          : p.position === "DF"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {positionLabels[p.position] || p.position}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-sm shadow-lg">
            <h3 className="font-bold mb-3 text-lg text-center text-green-600">
              ยืนยันการจองตำแหน่ง
            </h3>
            <p className="text-sm text-center mb-4">
              ต้องการจองตำแหน่ง{" "}
              <span className="font-semibold text-green-700">
                {positionLabels[selectedPos]}
              </span>{" "}
              หรือไม่?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setSelectedPos(null);
                }}
                className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  joinParty(postData._id, selectedPos);
                  setShowConfirm(false);
                  setSelectedPos(null);
                }}
                className="px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
