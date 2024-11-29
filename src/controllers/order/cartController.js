// controllers/cartController.js
import Cart from "#src/models/order/Cart.js";
import Product from "#models/product/Product.js";
import { quantityChecker } from "#services/cartService.js";

// @desc    Get user's cart
// @route   GET /api/carts
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name basePrice images variations"
    );
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Add item to cart
// @route   POST /api/carts
// @access  Private
export const addToCart = async (req, res) => {
  const { productId, variations, quantity } = req.body;
  const userId = req.user._id;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check for sufficient quantity in variations using helper function
    const quantityError = quantityChecker(product, variations, quantity);
    if (quantityError) {
      return res.status(400).json({ message: quantityError });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item with same product and variations exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        JSON.stringify(item.variations) === JSON.stringify(variations)
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        variations,
        quantity,
      });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/carts/item/:itemId
// @access  Private
export const updateCartItem = async (req, res) => {
  const { quantity } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const product = await Product.findById(item.product);
    // check if the total product quantity is sufficient
    const quantityError = quantityChecker(product, item.variations, quantity);
    if (quantityError) {
      return res.status(400).json({ message: quantityError });
    }

    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/carts/item/:itemId
// @access  Private
export const removeCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    item.deleteOne();
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Clear cart
// @route   DELETE /api/carts
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
