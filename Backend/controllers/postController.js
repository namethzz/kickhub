const Post = require("../models/Post");
const Field = require("../models/Field");
const User = require("../models/User");

const newPost = async (user_id, field_id, postdata) => {
  try {
    const field = await Field.findById(field_id);
    const user = await User.findById(user_id);
    if (!field) throw new Error("Field not found");
    const newPost = new Post({
      user_id,
      field_id,
      field_name: field.field_name,
      address: field.address,
      host_name: user.name,
      google_map: field.google_map,
      ...postdata,
      participants: [
        {
          user_id: user_id,
          name: user.name,
          position: postdata.position || null,
          status: "Joined",
          joined_at: new Date(),
        },
      ],
    });

    const savedPost = await newPost.save();
    return { success: true, data: savedPost };
  } catch (error) {
    console.error("Error creating post:", error);
    return { success: false, error };
  }
};

const getPostbyJoinerID = async (user_id) => {
  try {
    const posts = await Post.find({ "participants.user_id": user_id });
    return { success: true, data: posts };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { success: false, error };
  }
};

const getPostbyID = async (id) => {
  try {
    const posts = await Post.findById(id);
    return { success: true, data: posts };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { success: false, error };
  }
};

const deletePost = async (id) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(id);
    return { success: true, data: deletedPost };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error };
  }
};

const updatePost = async (id, postData) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(id, postData, {
      new: true,
    });
    return { success: true, data: updatedPost };
  } catch (error) {
    console.error("Error updating post:", error);
    return { success: false, error };
  }
};

const joinParty = async (id, user_id, position) => {
  const user = await User.findById(user_id);

  try {
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        $push: {
          participants: {
            user_id: user_id,
            name: user.name,
            position: position || null, // ✅ ใช้ค่าที่ส่งเข้ามา
            status: "Joined",
            joined_at: new Date(),
          },
        },
      },
      { new: true }
    );
    return { success: true, data: updatedPost };
  } catch (error) {
    console.error("Error updating post:", error);
    return { success: false, error };
  }
};

const leaveParty = async (id, user_id) => {
  const user = await User.findById(user_id);

  try {
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $pull: { participants: { user_id: user_id } } },
      { new: true }
    );
    return { success: true, data: updatedPost };
  } catch (error) {
    console.error("Error updating post:", error);
    return { success: false, error };
  }
};

module.exports = {
  newPost,
  getPostbyJoinerID,
  deletePost,
  updatePost,
  getPostbyID,
  joinParty,
  leaveParty,
};
