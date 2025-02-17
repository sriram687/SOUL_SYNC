import React from "react";

const ResourcesPage = () => {
  return (
    <div className="min-h-screen bg-purple-100 p-8 text-gray-900">
      <h1 className="text-4xl font-bold text-center mb-6">Mental Health Resources</h1>
      <p className="text-center mb-8">Find the support you need to prioritize your mental health.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Articles & Blogs</h2>
          <ul className="list-disc pl-6">
            <li><a href="https://example.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Coping Strategies for Anxiety</a></li>
            <li><a href="https://example.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">The Importance of Mental Well-Being</a></li>
          </ul>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Crisis Helplines</h2>
          <p>If you need immediate help, please contact one of the following helplines:</p>
          <ul className="list-disc pl-6">
            <li>National Mental Health Helpline: 1-800-123-4567</li>
            <li>Text HELP to 12345</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
