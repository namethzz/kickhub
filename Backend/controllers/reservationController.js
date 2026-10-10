const Reservation = require("../models/Reservation");

const addReservation = async (fieldId, user_id, reservationData) => {
  try {
    const newReservation = new Reservation({
      field_id: fieldId,
      user_id: user_id,
      ...reservationData,
    });
    const savedReservation = await newReservation.save();
    return { success: true, data: savedReservation };
  } catch (error) {
    return { success: false, error };
  }
};

const getAllReservations = async () => {
  try {
    const reservations = await Reservation.find();
    return { success: true, data: reservations };
  } catch (error) {
    return { success: false, error };
  }
};

const updateReservation = async (id, reservationData) => {
  try {
    const updatedReservation = await Reservation.findByIdAndUpdate(
      id,
      reservationData,
      {
        new: true,
      }
    );
    return { success: true, data: updatedReservation };
  } catch (error) {
    return { success: false, error };
  }
};

const getReservationbyID = async (id) => {
  try {
    const reservation = await Reservation.findById(id);
    return { success: true, data: reservation };
  } catch (error) {
    return { success: false, error };
  }
};

const getReservationbyFieldID = async (id) => {
  try {
    const reservation = await Reservation.find({ field_id: id });
    return { success: true, data: reservation };
  } catch (error) {
    return { success: false, error };
  }
};

const getReservationbyUserID = async (id) => {
  try {
    const reservation = await Reservation.find({ user_id: id });
    return { success: true, data: reservation };
  } catch (error) {
    return { success: false, error };
  }
};

module.exports = {
  addReservation,
  getAllReservations,
  updateReservation,
  getReservationbyID,
  getReservationbyFieldID,
  getReservationbyUserID,
};
