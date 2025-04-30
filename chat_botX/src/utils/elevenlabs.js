// utils/elevenlabs.js
import axios from 'axios';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY; // Replace with your API key

export const uploadVoiceClone = async (audioBlob) => {
  const formData = new FormData();
  formData.append('name', 'SoulSyncVoice');
  formData.append('files', new File([audioBlob], 'voice-sample.wav', { type: 'audio/wav' }));

  try {
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/voices/add',
      formData,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const voiceId = response.data.voice_id;
    localStorage.setItem('elevenLabsVoiceId', voiceId); // Save it here
    return voiceId;
  } catch (error) {
    const errMsg = error?.response?.data?.detail || error.message;
    console.error("Voice upload failed:", errMsg);

    if (errMsg.includes("maximum number of custom voices")) {
      alert("You've hit the limit! Delete an old voice from ElevenLabs before uploading a new one.");
    } else {
      alert("Voice upload failed: " + errMsg);
    }

    throw error;
  }
};


// utils/elevenlabs.js
export const textToSpeech = async (text, voiceId) => {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        },
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'blob', // Get the audio as a Blob
        }
      );
  
      // Create a URL for the audio Blob
      const audioUrl = URL.createObjectURL(response.data);
      return audioUrl;
    } catch (error) {
      console.error('Error generating TTS:', error);
      throw error;
    }
  };