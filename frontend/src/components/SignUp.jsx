import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import KHlogo from "../../public/KHlogo.png";
import Googlelogo from "../../public/google-icon-logo-svgrepo-com.svg";
import Applelogo from "../../public/apple-white-logo-svgrepo-com.svg";

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [inputs, setInputs] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const raw = JSON.stringify({
      name: inputs.fullName,
      email: inputs.email,
      password: inputs.password,
    });

    try {
      // แก้เป็นเลขเครื่องตัวเองนะ
      const res = await fetch("http://192.168.1.26:3000/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw,
      });

      if (res.ok) {
        alert("Sign Up Successful!");
        navigate("/Login");
      } else {
        alert("Sign Up Failed!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center h-screen w-screen bg-gray-100 md:bg-green-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="flex flex-col items-center justify-center md:flex-row bg-green-600 md:shadow-lg md:rounded-lg"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Left Logo */}
        <motion.div
          className="bg-green-600 flex items-center justify-center md:w[40rem] md:h-[40rem] md:rounded-s-lg"
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <img src={KHlogo} alt="Login Image" className="object-cover" />
        </motion.div>

        {/* Form */}
        <motion.div
          className="flex flex-col items-center bg-gray-100 rounded-t-[2rem] md:w-[40rem] md:h-[40rem] md:rounded-none w-full h-[full] md:rounded-e-lg"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="text-[3rem] font-black text-blue-600 mt-10 hidden md:block">
            CREATE ACCOUNT
          </h1>

          <form
            onSubmit={handleSubmit}
            className="bg-white flex flex-col gap-4 p-5 rounded-[2rem] shadow-lg mb-10 w-[25rem] mt-8"
          >
            <h1 className="text-black text-[1.5rem] font-bold mb-2 flex justify-center">
              Create an account
            </h1>

            <input
              type="text"
              className="border border-gray-300 text-black text-[0.9rem] opacity-80 w-full py-2 px-4 rounded-full outline-none focus:ring-2 focus:ring-green-400 transition"
              placeholder="Full Name"
              name="fullName"
              value={inputs.fullName}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              className="border border-gray-300 text-black text-[0.9rem] opacity-80 w-full py-2 px-4 rounded-full outline-none focus:ring-2 focus:ring-green-400 transition"
              placeholder="Email"
              name="email"
              value={inputs.email}
              onChange={handleChange}
              required
            />

            <div className="flex items-center border border-gray-300 rounded-full px-4 py-2">
              <input
                type={showPassword ? "text" : "password"}
                className="text-black text-[0.9rem] opacity-80 w-full outline-none"
                placeholder="Password"
                name="password"
                value={inputs.password}
                onChange={handleChange}
                required
              />
              {showPassword ? (
                <FaRegEyeSlash
                  className="cursor-pointer"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <FaRegEye
                  className="cursor-pointer"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>

            <motion.button
              type="submit"
              className="mt-4 bg-[#008080] text-white text-[1rem] font-medium py-2 rounded-full hover:bg-[#006666] cursor-pointer transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Create account
            </motion.button>

            <p className="text-black mt-3 text-[0.8rem] font-medium flex justify-center gap-1">
              Already have an account?
              <span
                onClick={() => navigate("/login")}
                className="text-blue-600 cursor-pointer hover:underline"
              >
                Sign In
              </span>
            </p>

            {/* Social Login */}
            <div className="flex flex-col gap-2 mt-3">
              <button
                type="button"
                className="flex items-center bg-black gap-2 text-[0.8rem] justify-center py-2 rounded-full hover:bg-gray-700 cursor-pointer transition"
              >
                <img src={Applelogo} alt="Apple" className="w-4 h-4" />
                <span className="text-white">Sign up with Apple</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-2 text-[0.8rem] justify-center py-2 rounded-full border border-gray-300 hover:bg-gray-200 cursor-pointer transition"
              >
                <img src={Googlelogo} alt="Google" className="w-4 h-4" />
                <span className="text-black">Sign up with Google</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
