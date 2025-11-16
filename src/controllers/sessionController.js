import Session from "../models/Session.js"

export const getConnectedBrowsers = async (req, res) => {
    try {
      const userId = req.userId; // Assuming userId is added by middleware
  
      const sessions = await Session.find({ userId }).select("deviceName browser loginTime");
      res.status(200).json({ sessions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  };

  export const disconnectSession = async (req, res) => {
    try {
      const { sessionId } = req.body; // ID of the session to delete
      await Session.findByIdAndDelete(sessionId);
      res.status(200).json({ message: "Session disconnected" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  };
  