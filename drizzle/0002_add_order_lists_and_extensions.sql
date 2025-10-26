-- Add status column to menuPlans
ALTER TABLE menuPlans 
ADD COLUMN status ENUM('entwurf', 'vorlage', 'aktiv', 'archiviert') DEFAULT 'entwurf' NOT NULL,
ADD COLUMN maxBudgetPerDay INT DEFAULT 0 COMMENT 'Maximum budget per day in cents',
ADD COLUMN budgetTolerance DECIMAL(5,2) DEFAULT 10.00 COMMENT 'Budget tolerance in percent';

-- Create orderLists table
CREATE TABLE orderLists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  menuPlanId INT,
  name VARCHAR(255) NOT NULL,
  status ENUM('entwurf', 'bestaetigt', 'bestellt', 'archiviert') DEFAULT 'entwurf' NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (menuPlanId) REFERENCES menuPlans(id) ON DELETE SET NULL
);

-- Create orderListItems table
CREATE TABLE orderListItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderListId INT NOT NULL,
  recipeId INT NOT NULL,
  portions INT NOT NULL,
  orderDay DATE NOT NULL,
  preparationTime INT DEFAULT 0 COMMENT 'Preparation time in hours',
  leadTime INT DEFAULT 0 COMMENT 'Lead time in days',
  FOREIGN KEY (orderListId) REFERENCES orderLists(id) ON DELETE CASCADE,
  FOREIGN KEY (recipeId) REFERENCES recipes(id)
);

-- Create menuPlanRecipes table for multiple recipes per meal
CREATE TABLE menuPlanRecipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entryId INT NOT NULL,
  recipeId INT NOT NULL,
  portions INT NOT NULL DEFAULT 4,
  isSelected BOOLEAN DEFAULT TRUE,
  isAlternative BOOLEAN DEFAULT FALSE,
  sortOrder INT DEFAULT 0,
  FOREIGN KEY (entryId) REFERENCES menuPlanEntries(id) ON DELETE CASCADE,
  FOREIGN KEY (recipeId) REFERENCES recipes(id)
);

-- Add indexes for better performance
CREATE INDEX idx_orderLists_userId ON orderLists(userId);
CREATE INDEX idx_orderListItems_orderListId ON orderListItems(orderListId);
CREATE INDEX idx_orderListItems_orderDay ON orderListItems(orderDay);
CREATE INDEX idx_menuPlanRecipes_entryId ON menuPlanRecipes(entryId);
