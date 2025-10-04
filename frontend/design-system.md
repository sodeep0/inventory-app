
# Stock Keeper: A Minimalist Design System

## 1. Design Philosophy

The Stock Keeper design system is built on the principles of minimalism, modernity, and consistency. Our goal is to create an intuitive and unobtrusive user experience that prioritizes content and functionality. By leveraging generous whitespace, a purposeful color palette, and a clear typographic hierarchy, we ensure that users can manage their inventory with focus and efficiency. The interface is clean, light, and designed to feel both professional and effortless.

---

## 2. Color Palette

The color palette is limited and intentional, creating a calm and focused atmosphere. The primary color establishes a strong brand identity, while accent colors are used sparingly for key actions.

| Color           | Hex Code  | Usage                               |
| --------------- | --------- | ----------------------------------- |
| **Primary**     | `#16697A` | Main headers, buttons, active icons |
| **Accent (CTA)**| `#FFA62B` | Floating action buttons, highlights |
| **Background**  | `#F8F8F8` | Main app background                 |
| **Surface**     | `#FFFFFF` | Cards, dialogs, input backgrounds   |
| **Text Primary**| `#333333` | Main body text, titles              |
| **Text Secondary**| `#828282` | Subtitles, labels, secondary info   |
| **Success**     | `#27AE60` | Confirmation messages, indicators   |
| **Error**       | `#EB5757` | Error messages, alerts, warnings    |
| **Border**      | `#E0E0E0` | Input borders, dividers             |

---

## 3. Typography

We use the 'Inter' typeface for its clean, neutral aesthetic and excellent readability on mobile screens. The typographic scale establishes a clear hierarchy, guiding the user's attention to the most important information.

- **Font Family:** Inter (Regular, Medium, SemiBold)

| Role                | Font Size | Weight    | Letter Spacing | Usage                               |
| ------------------- | --------- | --------- | -------------- | ----------------------------------- |
| **Display Title**   | 32px      | SemiBold  | -0.5px         | Welcome screens, major headings     |
| **Screen Title (H1)** | 24px      | SemiBold  | -0.25px        | Page and dialog titles              |
| **Section Title (H2)**| 18px      | Medium    | 0px            | Card titles, section headers        |
| **Body**            | 16px      | Regular   | 0.15px         | Main content, descriptions          |
| **Label / Button**  | 14px      | Medium    | 0.25px         | Input labels, button text           |
| **Caption**         | 12px      | Regular   | 0.4px          | Helper text, metadata, timestamps   |

---

## 4. Components

Components are the reusable building blocks of our interface. They are designed with consistency and modern aesthetics, featuring soft shadows and subtle transitions.

### Buttons

- **Corner Radius:** 8px
- **Padding:** 12px (vertical), 24px (horizontal)

| State         | Primary Button                                | Secondary Button                               |
| ------------- | --------------------------------------------- | ---------------------------------------------- |
| **Default**   | Solid `#16697A` background, white text        | `#16697A` outline (1px), `#16697A` text         |
| **Pressed**   | Darker shade (`#125561`), subtle inner shadow | Light `#16697A` background fill (10% opacity) |
| **Disabled**  | 50% opacity, no shadow                        | 50% opacity, no shadow                         |

### Cards

- **Background:** `#FFFFFF`
- **Corner Radius:** 12px
- **Padding:** 16px
- **Box Shadow:** `0px 4px 12px rgba(0, 0, 0, 0.05)` (A soft, diffused shadow)

### Input Fields

- **Background:** `#FFFFFF`
- **Corner Radius:** 8px
- **Border:** 1px solid `#E0E0E0`

| State      | Style                                           |
| ---------- | ----------------------------------------------- |
| **Default**| 1px solid `#E0E0E0` border                      |
| **Focused**| 1.5px solid `#16697A` border, subtle outer glow |
| **Error**  | 1.5px solid `#EB5757` border                    |

---

## 5. Home Screen Conceptual Design

The home screen serves as a central dashboard, providing an at-a-glance overview of the inventory status and quick access to common actions. It exemplifies the content-first approach.

- **Header:** A clean top bar with the "Dashboard" title (H1). A simple user profile icon sits on the right.

- **Content Area:** The screen is dominated by whitespace. The main content consists of two sections:
    1.  **Summary Cards:** A horizontal row of three key metric cards (e.g., "Total Items," "Stock Value," "Low Stock"). Each card uses a large, bold number and a simple label, providing instant insight without clutter.
    2.  **Recent Activity:** A vertically scrolling list of recent movements. Each list item is a simple card with an icon indicating the action type (e.g., sale, stock-in, return), a brief description ("5 units of 'Product X' sold"), and a timestamp.

- **Floating Action Button (FAB):** A circular button in the accent color (`#FFA62B`) is placed in the bottom-right corner. It features a simple plus (+) icon, allowing users to quickly initiate actions like "Add New Item" or "Record Sale" from anywhere in the app.

- **Navigation:** A minimalist bottom tab bar with three icons for "Dashboard," "Inventory," and "Reports." Only the active tab's icon and label are colored with the primary (`#16697A`) color; the others are neutral gray. This keeps the navigation clear but unobtrusive.
