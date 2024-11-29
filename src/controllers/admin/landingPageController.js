// controllers/landingPageController.js
import LandingPage from "../../models/LandingPage.js";
import { processAndSaveImage, deleteImage } from "../../services/imageService.js";

/**
 * @desc    Get the current landing page configuration
 * @route   GET /api/landing-page
 * @access  Public
 */
export const getLandingPage = async (req, res) => {
  try {
    let landingPage = await LandingPage.findOne();

    if (!landingPage) {
      // If no landing page exists, create a default one
      landingPage = new LandingPage();
      await landingPage.save();
    }

    res.json(landingPage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc    Update the landing page configuration
 * @route   PUT /api/landing-page
 * @access  Private/Admin
 */
export const updateLandingPage = async (req, res) => {
  try {
    let landingPage = await LandingPage.findOne();

    if (!landingPage) {
      landingPage = new LandingPage();
    }

    const { sections, removeImages } = req.body;
    const files = req.files || [];

    // Process uploaded images
    for (const [sectionName, sectionData] of Object.entries(sections || {})) {
      if (sectionData.image && req.files) {
        // Assuming the image field is sent as a file with key `${sectionName}_image`
        const imageFile = req.files.find(
          (file) => file.fieldname === `${sectionName}_image`
        );
        if (imageFile) {
          const imageUrl = await processAndSaveImage(
            imageFile.buffer,
            imageFile.originalname,
            "landing"
          );
          sectionData.image = imageUrl;
        }
      }

      // Handle slides if present
      if (sectionData.slides && Array.isArray(sectionData.slides)) {
        for (let slide of sectionData.slides) {
          if (slide.image && req.files) {
            // Assuming slide images are sent as files with key `slide_${slide.id}_image`
            const imageFile = req.files.find(
              (file) => file.fieldname === `slide_${slide.id}_image`
            );
            if (imageFile) {
              const imageUrl = await processAndSaveImage(
                imageFile.buffer,
                imageFile.originalname,
                "landing"
              );
              slide.image = imageUrl;
            }
          }
        }
      }

      // Update the section
      landingPage.sections.set(sectionName, sectionData);
    }

    // Handle image removals
    if (removeImages && Array.isArray(removeImages)) {
      for (const imageUrl of removeImages) {
        deleteImage(imageUrl);
        // Additionally, you might want to remove references from sections
        for (const [sectionName, sectionData] of landingPage.sections) {
          if (sectionData.image === imageUrl) {
            sectionData.image = undefined;
            landingPage.sections.set(sectionName, sectionData);
          }
          if (sectionData.slides && Array.isArray(sectionData.slides)) {
            sectionData.slides = sectionData.slides.map((slide) =>
              slide.image === imageUrl ? { ...slide, image: undefined } : slide
            );
            landingPage.sections.set(sectionName, sectionData);
          }
        }
      }
    }

    await landingPage.save();
    res.json(landingPage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
