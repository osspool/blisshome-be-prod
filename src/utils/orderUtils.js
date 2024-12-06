import Product from "#src/models/product/Product.js";

export const updateProductStock = async (productId, quantity) => {
    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: -quantity },
    });
  };

  
// This function can also be expanded to handle variations, as needed.
export const updateProductVariationStock = async (productId, variation, quantity) => {
    await Product.findOneAndUpdate(
      { _id: productId, "variations.name": variation.name, "variations.options.value": variation.option.value },
      {
        $inc: { "variations.$.options.$[option].quantity": -quantity }
      },
      { arrayFilters: [{ "option.value": variation.option.value }] }
    );
  };