import { useNavigate } from "react-router-dom";
import Login from "./Login";
import TimeSelector from "./testtime";
function Test1() {
  const Navigate = useNavigate();

  const dummydata = [
    {
      id: 1,
      fild_name: "สนามฟุตบอลศรีปทุม",
      status: "ว่าง",
    },
    {
      id: 2,
      fild_name: "สนามฟุตบอล A",
      status: "ไม่ว่าง",
    },
    {
      id: 3,
      fild_name: "สนามฟุตบอล B",
      status: "ว่าง",
    },
    {
      id: 4,
      fild_name: "สนามฟุตบอล C",
      status: "ไม่ว่าง",
    },
    {
      id: 5,
      fild_name: "สนามฟุตบอล D",
      status: "ว่าง",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-red-100">
      <div>
        <TimeSelector />
      </div>
      <div className="flex flex-col items-center justify-center mb-4">
        <h1 className="text-4xl font-bold text-black mb-4">
          congratulations you are logged in
        </h1>
        <h1>สนามทั้งหมด</h1>
      </div>
      <div className="flex flex-col items-center justify-center mb-4">
        {dummydata.map((item) => (
          <button
            key={item.id}
            className="cursor-pointer mb-4"
            onClick={() => Navigate(`/test/${item.id}`, { state: item })}
          >
            <h1>{item.fild_name}</h1>
            <h1>{item.status}</h1>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Test1;
