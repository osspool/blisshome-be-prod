// services/cartService.js

export const quantityChecker = (product, variations, quantity) => {
  // Check if the total product quantity is sufficient
  if (product.quantity < quantity) {
    return "Insufficient product quantity";
  }

  // If variations are provided, validate them
  if (variations && variations.length > 0) {
    for (let userVariation of variations) {
      // Find the corresponding variation in the product
      const productVariation = product.variations.find(
        (v) => v.name === userVariation.name
      );

      // If the variation name from input doesn't match any in the product, return an error
      if (!productVariation) {
        return `Invalid variation: ${userVariation.name}`;
      }

      // Find the selected option within the variation
      const selectedOption = productVariation.options.find(
        (opt) => opt.value === userVariation.option.value
      );

      // If the option doesn't exist in the product, return an error
      if (!selectedOption) {
        return `Invalid option for variation ${userVariation.name}: ${userVariation.option.value}`;
      }

      // Check if the quantity for this option is sufficient
      if (selectedOption.quantity < quantity) {
        return `Insufficient quantity for variation ${userVariation.name} with option ${selectedOption.value}. Available: ${selectedOption.quantity}, Requested: ${quantity}`;
      }
    }
  }

  // If no issues, return null (indicating success)
  return null;
};
