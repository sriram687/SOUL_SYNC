import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastTest = () => {
  const showToast = () => {
    console.log('Toast button clicked');
    toast.success('🎉 This is a test notification!');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Toast Test</h1>
      <button 
        onClick={showToast}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Show Toast
      </button>
      <ToastContainer />
    </div>
  );
};

export default ToastTest;
