import { useLocation } from "react-router-dom";

function Test2() {
  const location = useLocation();
  const item = location.state;

  console.log(item);

  return (
    <div>
      <h1>ยินดีต้อนรับ</h1>
      <h1>{item?.fild_name}</h1>
      <h1>ลำดับ: {item?.id}</h1>
    </div>
  );
}

export default Test2;
