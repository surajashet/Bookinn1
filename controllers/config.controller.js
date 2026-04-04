import supabase from "../config/supabaseClient.js";

// Get all configurations
export const getConfigurations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("System Configaration")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;

    // Convert array to key-value object for easy frontend use
    const config = {};
    data.forEach(item => {
      // Convert numeric values properly
      if (item.config_key === 'taxRate') {
        config[item.config_key] = parseFloat(item.config_value);
      } else {
        config[item.config_key] = item.config_value;
      }
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error("Get config error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get single configuration by key
export const getConfigByKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    const { data, error } = await supabase
      .from("System Configaration")
      .select("*")
      .eq("config_key", key)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found"
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error("Get config by key error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Create or update configuration
export const updateConfiguration = async (req, res) => {
  try {
    const { key, value, config_type, description } = req.body;
    const userId = req.user?.id;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: "Config key is required"
      });
    }

    // Determine config_type if not provided
    let detectedType = config_type;
    if (!detectedType) {
      if (typeof value === 'number') detectedType = 'number';
      else if (typeof value === 'boolean') detectedType = 'boolean';
      else detectedType = 'string';
    }

    // Check if config exists
    const { data: existing, error: checkError } = await supabase
      .from("System Configaration")
      .select("config_id")
      .eq("config_key", key)
      .maybeSingle();

    let result;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("System Configaration")
        .update({
          config_value: String(value),
          updated_at: new Date().toISOString()
        })
        .eq("config_key", key)
        .select();

      if (error) throw error;
      result = data[0];
    } else {
      // Create new
      const { data, error } = await supabase
        .from("System Configaration")
        .insert([{
          config_key: key,
          config_value: String(value),
          config_type: detectedType,
          description: description || '',
          is_active: true,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      result = data[0];
    }

    res.json({
      success: true,
      message: "Configuration saved successfully",
      data: result
    });
  } catch (error) {
    console.error("Update config error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Bulk update configurations
export const bulkUpdateConfigurations = async (req, res) => {
  try {
    const { configurations } = req.body;
    const userId = req.user?.id;

    if (!configurations || typeof configurations !== 'object') {
      return res.status(400).json({
        success: false,
        error: "Configurations object is required"
      });
    }

    const results = [];
    
    for (const [key, value] of Object.entries(configurations)) {
      // Determine config_type
      let detectedType = 'string';
      if (typeof value === 'number') detectedType = 'number';
      else if (typeof value === 'boolean') detectedType = 'boolean';

      // Check if config exists
      const { data: existing, error: checkError } = await supabase
        .from("System Configaration")
        .select("config_id")
        .eq("config_key", key)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("System Configaration")
          .update({
            config_value: String(value),
            updated_at: new Date().toISOString()
          })
          .eq("config_key", key)
          .select();

        if (error) throw error;
        results.push(data[0]);
      } else {
        // Create new
        const { data, error } = await supabase
          .from("System Configaration")
          .insert([{
            config_key: key,
            config_value: String(value),
            config_type: detectedType,
            description: '',
            is_active: true,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();

        if (error) throw error;
        results.push(data[0]);
      }
    }

    res.json({
      success: true,
      message: "Configurations saved successfully",
      data: results
    });
  } catch (error) {
    console.error("Bulk update config error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Delete configuration (soft delete)
export const deleteConfiguration = async (req, res) => {
  try {
    const { key } = req.params;

    const { data, error } = await supabase
      .from("System Configaration")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("config_key", key)
      .eq("is_active", true)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configuration not found"
      });
    }

    res.json({
      success: true,
      message: "Configuration deleted successfully",
      data: data[0]
    });
  } catch (error) {
    console.error("Delete config error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Initialize default configurations
export const initializeDefaultConfigs = async (req, res) => {
  try {
    const defaultConfigs = [
      { key: 'taxRate', value: '18', type: 'number', description: 'GST/Tax rate percentage' },
      { key: 'cancellationPolicy', value: '24 hours before check-in for full refund', type: 'text', description: 'Hotel cancellation policy' },
      { key: 'earlyCheckIn', value: '12:00 PM', type: 'string', description: 'Early check-in time' },
      { key: 'lateCheckOut', value: '2:00 PM', type: 'string', description: 'Late check-out time' }
    ];

    const results = [];

    for (const config of defaultConfigs) {
      // Check if exists
      const { data: existing } = await supabase
        .from("System Configaration")
        .select("config_id")
        .eq("config_key", config.key)
        .maybeSingle();

      if (!existing) {
        const { data, error } = await supabase
          .from("System Configaration")
          .insert([{
            config_key: config.key,
            config_value: config.value,
            config_type: config.type,
            description: config.description,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();

        if (error) throw error;
        results.push(data[0]);
      }
    }

    res.json({
      success: true,
      message: `Initialized ${results.length} default configurations`,
      data: results
    });
  } catch (error) {
    console.error("Initialize configs error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};