const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken } = require("../middleware/verifyToken");

router.get("/", productController.publicList);
router.get("/:id", productController.publicGetById);

router.post("/", verifyToken, productController.adminCreate);
router.put("/:id", verifyToken, productController.adminUpdate);
router.delete("/:id", verifyToken, productController.adminArchive); // “Eliminar” = archivar

module.exports = router;