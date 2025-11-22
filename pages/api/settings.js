import {mongooseConnect} from "@/lib/mongoose";
import {isAdminRequest} from "@/pages/api/auth/[...nextauth]";
import {Settings} from "@/models/Settings";
import {deleteS3Object} from "@/lib/s3";

export default async function handle(req, res) {
  await mongooseConnect();
  await isAdminRequest(req,res);

  if (req.method === 'GET') {
    const settings = await Settings.find();
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.name] = setting.value;
    });
    res.json(settingsObj);
  }

  if (req.method === 'POST') {
    const {
      featuredProductId, 
      shippingPrice, 
      heroVideoDesktop, 
      heroVideoMobile, 
      heroTitle, 
      heroSubtitle
    } = req.body;
    
    // Get current settings to check for old videos
    const currentSettings = await Settings.find();
    const currentSettingsObj = {};
    currentSettings.forEach(setting => {
      currentSettingsObj[setting.name] = setting.value;
    });
    
    // Delete old desktop video if it's being replaced
    if (currentSettingsObj.heroVideoDesktop && 
        currentSettingsObj.heroVideoDesktop !== heroVideoDesktop) {
      try {
        await deleteS3Object(currentSettingsObj.heroVideoDesktop);
        console.log('Deleted old desktop video:', currentSettingsObj.heroVideoDesktop);
      } catch (error) {
        console.error('Error deleting old desktop video:', error);
      }
    }
    
    // Delete old mobile video if it's being replaced
    if (currentSettingsObj.heroVideoMobile && 
        currentSettingsObj.heroVideoMobile !== heroVideoMobile) {
      try {
        await deleteS3Object(currentSettingsObj.heroVideoMobile);
        console.log('Deleted old mobile video:', currentSettingsObj.heroVideoMobile);
      } catch (error) {
        console.error('Error deleting old mobile video:', error);
      }
    }
    
    // Update or create featured product setting
    await Settings.findOneAndUpdate(
      {name: 'featuredProductId'},
      {value: featuredProductId},
      {upsert: true}
    );
    
    // Update or create shipping price setting
    await Settings.findOneAndUpdate(
      {name: 'shippingPrice'},
      {value: shippingPrice},
      {upsert: true}
    );

    // Update or create hero video desktop setting
    await Settings.findOneAndUpdate(
      {name: 'heroVideoDesktop'},
      {value: heroVideoDesktop},
      {upsert: true}
    );

    // Update or create hero video mobile setting
    await Settings.findOneAndUpdate(
      {name: 'heroVideoMobile'},
      {value: heroVideoMobile},
      {upsert: true}
    );

    // Update or create hero title setting
    await Settings.findOneAndUpdate(
      {name: 'heroTitle'},
      {value: heroTitle},
      {upsert: true}
    );

    // Update or create hero subtitle setting
    await Settings.findOneAndUpdate(
      {name: 'heroSubtitle'},
      {value: heroSubtitle},
      {upsert: true}
    );
    
    res.json({success: true});
  }

  if (req.method === 'DELETE') {
    const { videoType } = req.body; // 'desktop' or 'mobile'
    
    // Get current settings
    const currentSettings = await Settings.find();
    const currentSettingsObj = {};
    currentSettings.forEach(setting => {
      currentSettingsObj[setting.name] = setting.value;
    });
    
    // Delete video from S3 and remove from settings
    if (videoType === 'desktop' && currentSettingsObj.heroVideoDesktop) {
      try {
        await deleteS3Object(currentSettingsObj.heroVideoDesktop);
        console.log('Deleted desktop video:', currentSettingsObj.heroVideoDesktop);
      } catch (error) {
        console.error('Error deleting desktop video:', error);
      }
      await Settings.findOneAndUpdate(
        {name: 'heroVideoDesktop'},
        {value: ''},
        {upsert: true}
      );
    }
    
    if (videoType === 'mobile' && currentSettingsObj.heroVideoMobile) {
      try {
        await deleteS3Object(currentSettingsObj.heroVideoMobile);
        console.log('Deleted mobile video:', currentSettingsObj.heroVideoMobile);
      } catch (error) {
        console.error('Error deleting mobile video:', error);
      }
      await Settings.findOneAndUpdate(
        {name: 'heroVideoMobile'},
        {value: ''},
        {upsert: true}
      );
    }
    
    res.json({success: true});
  }
}
