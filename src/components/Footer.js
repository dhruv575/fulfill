import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <p>© {new Date().getFullYear()} Fulfill NJ. All rights reserved.</p>
        </div>
        <div className="footer-center">
          <p>Providing food security to Monmouth and Ocean Counties</p>
        </div>
        <div className="footer-right">
          <div className="developed-by">
            <p>Developed by</p>
            <img 
              src={process.env.PUBLIC_URL + '/images/HackLogo.png'} 
              alt="Hack4Impact Logo" 
              className="hack-logo" 
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 