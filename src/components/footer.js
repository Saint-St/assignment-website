// components/footer.js
export function createFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  
  const container = document.createElement('div');
  container.className = 'footer-container';
  
  const copyright = document.createElement('p');
  copyright.className = 'copyright';
  copyright.textContent = `© ${new Date().getFullYear()} Assignment Submission Portal. All rights reserved.`;
  
  const links = document.createElement('div');
  links.className = 'footer-links';
  
  const linkList = document.createElement('ul');
  
  const termsItem = document.createElement('li');
  const termsLink = document.createElement('a');
  termsLink.href = '#';
  termsLink.textContent = 'Terms of Service';
  termsItem.appendChild(termsLink);
  
  const privacyItem = document.createElement('li');
  const privacyLink = document.createElement('a');
  privacyLink.href = '#';
  privacyLink.textContent = 'Privacy Policy';
  privacyItem.appendChild(privacyLink);
  
  const contactItem = document.createElement('li');
  const contactLink = document.createElement('a');
  contactLink.href = '#';
  contactLink.textContent = 'Contact Us';
  contactItem.appendChild(contactLink);
  
  linkList.appendChild(termsItem);
  linkList.appendChild(privacyItem);
  linkList.appendChild(contactItem);
  links.appendChild(linkList);
  
  container.appendChild(copyright);
  container.appendChild(links);
  footer.appendChild(container);
  
  return footer;
}

export function initFooter() {
  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    footerContainer.appendChild(createFooter());
  }
}