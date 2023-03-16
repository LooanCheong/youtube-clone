import User from "../models/User";
import Video from "../models/Video";
import fetch from "node-fetch";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => res.render("join", { pageTitle: "Join" });
export const postJoin = async (req, res) => {
  const { name, username, email, password, password2, location } = req.body;
  const pageTitle = "Join";
  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "Password confirmation does not match.",
    });
  }
  const exists = await User.exists({
    $or: [{ username }, { email }],
  });
  if (exists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "This username|e-mail is already taken.",
    });
  }

  try {
    await User.create({
      name,
      username,
      email,
      password,
      location,
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: error._message,
    });
  }
};
export const getLogin = (req, res) =>
  res.render("login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "Login";
  const user = await User.findOne({ username, socialOnly: false });
  if (!user) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "An account with this username does not exists.",
    });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "Wrong password",
    });
  }
  req.session.loggedIn = true;
  req.session.user = user;
  res.redirect("/");
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
  ).json();
  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        name: userData.name,
        username: userData.login,
        email: emailObj.email,
        password: "",
        socialOnly: true,
        location: userData.location,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

const isServer = process.env.NODE_ENV === "production";

export const startKakaoLogin = (req, res) => {
  const REST_API_KEY = process.env.KKT_CLIENT;
  let REDIRECT_URI = "";
  if (isServer) {
    REDIRECT_URI = "https://mytube.fly.dev/users/kakao/finish";
  } else {
    REDIRECT_URI = "http://localhost:4000/users/kakao/finish";
  }
  const finalUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  return res.redirect(finalUrl);
};

export const finishKakaoLogin = async (req, res) => {
  const options = {
    client_id: process.env.KKT_CLIENT,
    client_secret: process.env.KKT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: isServer
      ? "https://mytube.fly.dev/users/kakao/finish"
      : "http://localhost:4000/users/kakao/finish",
    code: req.query.code,
  };
  const params = new URLSearchParams(options).toString();
  const finalUrl = `https://kauth.kakao.com/oauth/token?${params}`;

  const tokenReq = await fetch(finalUrl, {
    method: "POST",
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
    },
  });

  const json = await tokenReq.json();
  if ("access_token" in json) {
    const apiUrl = "https://kapi.kakao.com/v2/user/me";
    const { access_token } = json;
    const userReq = await (
      await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-type": "application/x-www-form-urlencoded",
        },
      })
    ).json();
    const userData = userReq.kakao_account;
    const email = userReq.kakao_account.email;
    const randomString = Math.random().toString(36).substr(2, 10);
    const username = `kakao_${randomString}`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: userData.profile.nickname,
        username: username,
        email: email,
        password: "",
        socialOnly: true,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;

    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const startNaverLogin = (req, res) => {
  const baseUrl = "https://nid.naver.com/oauth2.0/authorize";
  const config = {
    response_type: "code",
    client_id: process.env.NAVER_CLIENT,
    redirect_uri: isServer
      ? "https://mytube.fly.dev/users/naver/finish"
      : "http://localhost:4000/users/naver/finish",
    state: "test",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;

  return res.redirect(finalUrl);
};

export const finishNaverLogin = async (req, res) => {
  const baseUrl = "https://nid.naver.com/oauth2.0/token";
  const config = {
    grant_type: "authorization_code",
    client_id: process.env.NAVER_CLIENT,
    client_secret: process.env.NAVER_SECRET,
    code: req.query.code,
    state: "test",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;

  const tokenReq = await fetch(finalUrl, {
    method: "POST",
  });

  const json = await tokenReq.json();

  if ("access_token" in json) {
    const apiUrl = "https://openapi.naver.com/v1/nid/me";
    const { access_token } = json;
    const userReq = await (
      await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    ).json();
    const name = userReq.response.name;
    const email = userReq.response.email;
    const randomString = Math.random().toString(36).substr(2, 10);
    const username = `naver_${randomString}`;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        username,
        email,
        password: "",
        socialOnly: true,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;

    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const logout = (req, res) => {
  req.session.destroy();
  return res.redirect("/");
};

export const getEdit = (req, res) => {
  return res.render("edit-profile", {
    pageTitle: "Edit Profile",
  });
};

// 나중에 수정

export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl, email: sessionEmail, username: sessionUsername },
    },
    body: { name, email, username, location },
    file,
  } = req;

  let searchEmail = [];
  let searchUsername = [];
  if (email !== sessionEmail) {
    searchEmail.push({ email });
  }
  if (username !== sessionUsername) {
    searchUsername.push({ username });
  }

  const foundUser = await User.findOne({
    $or: [{ searchUsername }, { searchEmail }],
  });
  if (searchEmail.length != 0) {
    if (foundUser && foundUser._id.toString() !== _id) {
      return res.status(400).render("edit-profile", {
        pageTitle: "Edit Profile",
        errorMessage: "This E-mail is already taken.",
      });
    }
  } else if (searchUsername.length != 0) {
    if (foundUser && foundUser._id.toString() !== _id) {
      return res.status(400).render("edit-profile", {
        pageTitle: "Edit Profile",
        errorMessage: "This Username is already taken.",
      });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file ? file.location : avatarUrl,
      name,
      email,
      username,
      location,
    },
    { new: true }
  );
  req.session.user = updatedUser;
  return res.redirect("/users/edit");
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly === true) {
    req.flash("error", "Can't change password");
    return res.redirect("/");
  }
  return res.render("users/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
  const {
    session: {
      user: { _id },
    },
    body: { oldPassword, newPassword, newPasswordConfirmation },
  } = req;
  const user = await User.findById(_id);
  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The current password is incorrect",
    });
  }
  if (newPassword !== newPasswordConfirmation) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The password does not match the confirmation",
    });
  }
  if (oldPassword === newPassword) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The new password equals old password",
    });
  }
  // 로그아웃 시키면 세션 업데이트 필요없음(수정예정)
  user.password = newPassword;
  await user.save();
  req.session.destroy();
  return res.redirect("/login");
};

export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate({
    path: "videos",
    populate: "owner",
  });
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not found." });
  }
  return res.render("users/profile", {
    pageTitle: user.username,
    user,
  });
};

export const myVideo = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate({
    path: "videos",
    populate: "owner",
  });
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not found." });
  }
  return res.render("users/myVideo", {
    pageTitle: user.username,
    user,
  });
};

export const likedVideo = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not found." });
  }
  const videos = await Video.find({ like: id }).populate("owner");
  return res.render("users/likedVideo", {
    pageTitle: user.username,
    user,
    videos,
  });
};

export const followingVideo = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not found." });
  }
  const following = user.following;
  const videos = await Video.find({ owner: following })
    .sort({ createdAt: "desc" })
    .populate("owner");

  return res.render("users/followingVideo", {
    pageTitle: user.username,
    user,
    videos,
  });
};
