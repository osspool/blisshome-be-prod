// services/addressService.js

/**
 * Retrieves the delivery address based on the provided flag.
 * @param {Object} user - The user object.
 * @param {Boolean} useSavedAddress - Flag to determine address type.
 * @param {String} deliveryAddressId - ID of the saved address.
 * @param {Object} manualAddress - Manual address details.
 * @returns {Object} - Formatted delivery address.
 * @throws {Error} - If address retrieval fails.
 */
export const getDeliveryAddress = async (user, useSavedAddress, deliveryAddressId, manualAddress) => {
  if (useSavedAddress) {
    if (!deliveryAddressId) {
      throw new Error("Delivery address ID is required when using a saved address.");
    }
    const address = user.addresses.id(deliveryAddressId);
    if (!address) {
      throw new Error("Invalid delivery address ID.");
    }
    return {
      label: address.label,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
    };
  } else {
    if (!manualAddress) {
      throw new Error("Manual address details are required.");
    }
    const { label, addressLine1, addressLine2, city, state, postalCode, country, phone } = manualAddress;
    return { label, addressLine1, addressLine2, city, state, postalCode, country, phone };
  }
};
