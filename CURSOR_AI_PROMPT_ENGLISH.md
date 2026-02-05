# Cursor AI Prompt (English Version)

## Initial Confirmation Prompt (Copy paste this to Cursor)

```
I want to build a cashier and shrimp transaction recording application with the following specifications.

TECHNOLOGY STACK:
- React with Vite
- Shadcn/ui for UI components
- Supabase as database
- React Router for navigation
- React Hook Form for form handling
- Date-fns for date manipulation
- Lucide React for icons

SUPABASE DATABASE STRUCTURE:
- Table: users (for admin)
- Table: products (product master and pricing)
- Table: purchase_categories (purchase categories)
- Table: sales_transactions (sales transaction header)
- Table: sales_details (sales item details)
- Table: purchase_transactions (purchase transactions)

APPLICATION FEATURES:

1. AUTHENTICATION & AUTHORIZATION
   - Admin login
   - Session management

2. MASTER DATA PAGE
   - CRUD products (name, price, unit)
   - CRUD purchase categories
   - Table with pagination, search, and sort

3. DASHBOARD PAGE (Main Page)
   - Monthly sales calculation display (current month)
   - Statistics cards: Total Sales This Month, Total Purchases This Month, Profit/Loss
   - Simple chart/graph (optional)

4. TRANSACTION ENTRY PAGE
   Layout: 2 columns side-by-side
   
   Column 1 - Sales Table:
   - Display all sales transactions, default 10 latest
   - Pagination
   - Columns: Date, Transaction No., Total, Actions (Edit, Delete)
   
   Column 2 - Purchase Table:
   - Display all purchase transactions, default 10 latest
   - Pagination
   - Columns: Date, Category, Description, Amount, Actions (Edit, Delete)
   
   Buttons above tables:
   - "New Sales Entry" button
   - "New Purchase Entry" button
   
   SALES ENTRY DIALOG:
   - DatePicker for transaction date (can backdate)
   - Product list from master (can select product, input quantity)
   - "+" button to add product item
   - "-" button to remove item
   - Total price with realtime auto-calculation
   - "Generate Invoice" button
   - When click "Generate Invoice" → show Invoice Preview Dialog (summary table)
   - Invoice Preview Dialog has "Confirm" button to save to database
   
   PURCHASE ENTRY DIALOG:
   - DatePicker for transaction date (can backdate)
   - Purchase category dropdown (from master)
   - Purchase description input
   - Amount/price input
   - "+" button to add new purchase item
   - "Save" button to save all items at once

5. FINANCIAL REPORT PAGE
   Filter Section:
   - Filter by Product (dropdown)
   - Filter by Date/Month (date range picker)
   - "Apply Filter" button
   
   Transaction Table:
   - Combined view of sales and purchases
   - Columns: Date, Type (Sales/Purchase), Description, Debit, Credit
   
   Summary Section:
   - Total Sales in period
   - Total Purchases in period
   - Profit/Loss
   - "Generate PDF Report" button (optional in phase 1)

ROUTING STRUCTURE:
/login
/dashboard
/master/products
/master/categories
/transactions
/reports

UI/UX REQUIREMENTS:
- Responsive design (mobile-friendly)
- Modern and clean interface
- Smooth entrance of dialog boxes
- Loading states on every action
- Toast notifications for success/error
- Confirmation dialog before delete
- Form validation

BEFORE STARTING TO CODE:
1. Confirm that you understand all the requirements above
2. Create the folder structure that will be used
3. List all files that will be created
4. Explain the data flow from UI to Supabase
5. Ask if anything is unclear or needs clarification

After confirmation, we will start development step-by-step, starting from:
1. Setup routing and layout
2. Authentication
3. Master data pages
4. Dashboard
5. Transaction pages
6. Reports page

Are you ready? Please confirm your understanding first.
```

---

## How to Use This Prompt

1. **Copy the entire prompt** above (inside the code block)
2. **Open Cursor AI** in your project
3. **Paste the prompt** into Cursor's chat
4. **Wait for confirmation** - Cursor should respond with:
   - Confirmation of understanding
   - Proposed folder structure
   - List of files to be created
   - Data flow explanation
   - Any clarification questions
5. **Once confirmed**, proceed with step-by-step development

---

## Expected Cursor Response

Cursor should respond with something like:

```
Yes, I understand the requirements. Let me confirm:

FOLDER STRUCTURE:
[Cursor will provide the structure]

FILES TO CREATE:
[Cursor will list all files]

DATA FLOW:
[Cursor will explain UI → Supabase flow]

CLARIFICATIONS:
[Any questions Cursor has]

Shall we proceed with Step 1: Setup routing and layout?
```

---

## Tips for Best Results

- ✅ **Be patient** - Let Cursor confirm everything before coding
- ✅ **Review the structure** - Make sure the proposed structure makes sense
- ✅ **Ask questions** - If Cursor's explanation is unclear, ask for clarification
- ✅ **One step at a time** - Don't rush, follow the phases sequentially
- ✅ **Test frequently** - After each major feature, test before moving on
