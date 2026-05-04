import React from "react";

const HistoryButton = ({ onClick }) => (
  <button className="btn control" onClick={onClick} title="Show calculation history">
    History
  </button>
);

export default HistoryButton;