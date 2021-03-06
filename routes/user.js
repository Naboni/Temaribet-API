require("dotenv").config();
const router = require("express").Router();
const {
  userRegister,
  userLogin,
  adminRegister,
  adminLogin,
} = require("../Utils/auth");
const { PrismaClient } = require("@prisma/client");
const check_auth = require("../middlewares/check_auth");
const check_role = require("../middlewares/check_role");

let rT = require("../config/refreshTokens");
let refreshTokens = rT.refreshTokens;

const prisma = new PrismaClient();

// Register User
router.post("/register", async (req, res, next) => {
  await userRegister(req, res, next);
});
// Register Admin
router.post(
  "/adminRegister",
  check_role("SUPERADMIN"),
  async (req, res, next) => {
    await adminRegister(req, res, next);
  }
);
// Login User
router.post("/login", async (req, res, next) => {
  await userLogin(req, res, next);
});
// Login Admin
router.post("/adminLogin", async (req, res, next) => {
  await adminLogin(req, res, next);
});

router.post("/logout", check_auth, (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.status(200).json("You logged out successfully.");
});

router.get("/", check_auth, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ success: true, message: "List of Users", users: users });
  } catch (error) {
    res.json({ success: false, message: "Something went wrong." });
    next(error);
  }
});

router.get("/:id", check_auth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        tutor: true,
        parent: true,
      },
    });
    if (user) {
      res.json(user);
    } else {
      res.json({ success: true, message: `User not found` });
    }
  } catch (error) {
    res.json({ success: false, message: error.toString() });
    next(error);
  }
});

router.patch("/:id", check_auth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: Number(id),
      },
      include: {
        tutor: true,
        parent: true,
      },
      data: req.body,
    });
    res.json({
      success: true,
      message: `Updated user ${id}`,
      user: updatedUser,
    });
  } catch (error) {
    res.json({ success: false, message: "Something went wrong." });
    next(error);
  }
});

router.delete(
  "/:id",
  check_auth,
  check_role("ADMIN"),
  async (req, res, next) => {
    const { id } = req.params;
    try {
      const deletedUser = await prisma.user.delete({
        where: {
          id: Number(id),
        },
      });
      res.json({
        success: true,
        message: `Deleted user ${id}`,
        user: deletedUser,
      });
    } catch (error) {
      res.json({ success: false, message: "Something went wrong." });
      next(error);
    }
  }
);

module.exports = router;
