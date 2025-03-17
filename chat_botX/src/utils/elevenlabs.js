// utils/elevenlabs.js
import axios from 'axios';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY; // Replace with your API key

export const uploadVoiceClone = async (audioBlob) => {
  const formData = new FormData();
  formData.append('name', 'SoulSyncVoice'); // Name for the cloned voice
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

    return response.data.voice_id; // Return the voice_id
  } catch (error) {
    console.error("Error uploading voice sample:", error.response ? error.response.data : error.message);
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