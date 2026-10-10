import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import { IoLockClosedOutline } from "react-icons/io5";
import { MdOutlineAlternateEmail } from "react-icons/md";
import KHlogo from "../../public/KHlogo.png";
import Googlelogo from "../../public/google-icon-logo-svgrepo-com.svg";
import Applelogo from "../../public/apple-black-logo-svgrepo-com.svg";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [inputs, setInputs] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const raw = JSON.stringify({
      email: inputs.email,
      password: inputs.password,
    });

    try {
      // แก้เป็นเลขเครื่องตัวเองนะ
      const res = await fetch("http://172.20.10.4:3000/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw,
      });
      const result = await res.json();
      if (result.status === "ok") {
        localStorage.setItem("token", result.token);
        alert("Login Successful!");
        navigate("/test");
      } else {
        alert("Login Failed: " + result.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred while logging in." + error);
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center h-screen bg-gray-100 md:bg-green-800 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="flex flex-col items-center justify-center md:flex-row bg-green-600 md:shadow-lg md:rounded-lg"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Left Side (Logo) */}
        <motion.div
          className="bg-green-600 flex items-center justify-center md:w-160 md:h-160 md:rounded-s-lg"
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <motion.img
            src={KHlogo}
            alt="Login Image"
            className="object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />
        </motion.div>

        {/* Form Section */}
        <motion.div
          className="flex flex-col items-center bg-gray-100 rounded-t-4xl md:w-160 md:h-160 md:rounded-none w-full h-full md:rounded-e-lg"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="flex justify-center text-[3rem] font-black text-blue-600 mt-10 hidden md:block">
            WELCOME
          </h1>

          <form
            onSubmit={handleSubmit}
            className="bg-white flex flex-col gap-3 p-5 rounded-4xl shadow-lg mb-10 mt-8 w-100"
          >
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-black text-[0.9rem] font-bold">
                Email
              </label>
              <div className="flex items-center border border-gray-300 w-full px-3 py-2 rounded-full gap-2 focus-within:ring-2 focus-within:ring-green-400 transition">
                <MdOutlineAlternateEmail className="text-black text-[1rem]" />
                <input
                  type="text"
                  className="text-black text-[0.9rem] opacity-80 w-full outline-none bg-transparent"
                  placeholder="Enter your Email || example: karn.yong"
                  name="email"
                  value={inputs.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-black text-[0.9rem] font-bold">
                Password
              </label>
              <div className="flex items-center border border-gray-300 w-full px-3 py-2 rounded-full gap-2 focus-within:ring-2 focus-within:ring-green-400 transition">
                <IoLockClosedOutline className="text-black text-[1rem]" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="text-black text-[0.9rem] opacity-80 w-full outline-none bg-transparent"
                  placeholder="Enter your Password || example: melivecode"
                  name="password"
                  value={inputs.password}
                  onChange={handleChange}
                />
                {showPassword ? (
                  <FaRegEyeSlash
                    className="cursor-pointer text-gray-700 hover:text-green-600 transition"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <FaRegEye
                    className="cursor-pointer text-gray-700 hover:text-green-600 transition"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex justify-between mt-2 text-[0.8rem]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-green-600 cursor-pointer w-4 h-4"
                />
                Remember me
              </label>
              <span className="text-blue-600 font-medium cursor-pointer hover:underline">
                Forgot Password?
              </span>
            </div>

            {/* Login Button */}
            <motion.button
              type="submit"
              className="mt-3 bg-black text-white text-[1rem] font-medium py-2 rounded-full hover:bg-gray-800 cursor-pointer transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In
            </motion.button>

            {/* Go to Sign Up */}
            <p className="text-black mt-3 text-[0.8rem] flex justify-center gap-1">
              Don’t have an account?
              <span
                onClick={() => navigate("/signup")}
                className="text-blue-600 cursor-pointer hover:underline"
              >
                Sign Up
              </span>
            </p>

            {/* Social Login */}
            <div className="flex flex-col items-center mt-2 gap-2">
              <p className="text-gray-600 text-[0.8rem]">Or sign in with</p>

              <div className="flex gap-3 w-full">
                {/* Google */}
                <motion.button
                  type="button"
                  className="flex items-center gap-2 text-[0.8rem] w-full justify-center py-2 px-4 rounded-full border border-gray-300 hover:bg-gray-100 cursor-pointer transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src={Googlelogo} alt="Google" className="w-4 h-4" />
                  <span className="text-black font-medium">Google</span>
                </motion.button>

                {/* Apple */}
                <motion.button
                  type="button"
                  className="flex items-center gap-2 text-[0.8rem] w-full justify-center py-2 px-4 rounded-full border border-gray-300 hover:bg-gray-100 cursor-pointer transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img src={Applelogo} alt="Apple" className="w-4 h-4" />
                  <span className="text-black font-medium">Apple</span>
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
