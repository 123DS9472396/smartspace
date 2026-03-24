console.log('Clearing theme from localStorage and forcing dark theme...');
localStorage.removeItem('theme');
localStorage.setItem('theme', 'professional');
location.reload();
