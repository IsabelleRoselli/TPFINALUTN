const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { verifyToken } = require("../middleware/verifyToken");

router.get("/", categoryController.list);
router.get("/:id", categoryController.getById);

router.post("/", verifyToken, categoryController.create);
router.put("/:id", verifyToken, categoryController.update);
router.delete("/:id", verifyToken, categoryController.remove);

module.exports = router;