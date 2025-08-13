# VS Code Testing Integration Guide

This guide shows you how to use the integrated testing features in VS Code with your ManyPaintings project.

## 🎯 Quick Setup Summary

Your VS Code is now configured with:
- ✅ **pytest testing enabled** in settings.json
- ✅ **Test discovery** on file save 
- ✅ **Debug configurations** for running/debugging tests
- ✅ **Task runners** for different test scenarios
- ✅ **Virtual environment** auto-activation

## 📍 How to Access Tests in VS Code

### 1. Test Explorer (Primary Method)
- **Open Test Explorer**: Click the flask/beaker icon in the Activity Bar (left side)
- **Or**: `Ctrl+Shift+P` → "Python: Configure Tests" → Select "pytest"
- **Or**: View menu → "Testing"

### 2. What You'll See
```
🧪 TESTS
├── 📁 tests/
│   ├── 📁 e2e/
│   │   ├── ✅ test_core_functionality.py
│   │   └── ✅ test_favorites_system.py  
│   ├── ✅ test_app.py
│   ├── ✅ test_config.py
│   └── ✅ test_image_manager.py
```

## 🚀 Running Tests

### Via Test Explorer (Recommended)
1. **Run all tests**: Click ▶️ next to "TESTS" 
2. **Run single test file**: Click ▶️ next to `test_app.py`
3. **Run individual test**: Click ▶️ next to specific test function
4. **Debug test**: Click 🐛 debug icon next to any test

### Via Command Palette (`Ctrl+Shift+P`)
- **Python: Run All Tests**
- **Python: Run Current Test File** 
- **Python: Run Test Method** (when cursor is in test function)

### Via Tasks (`Ctrl+Shift+P` → "Tasks: Run Task")
- **PyTest: Run All Tests** (default test task)
- **PyTest: Backend Tests** 
- **PyTest: E2E Tests**
- **PyTest: With Coverage**

### Via Debug Panel (`F5` or Ctrl+Shift+D)
- **Python: All Tests** - Run all tests in debug mode
- **Python: Backend Tests Only** - Debug backend tests
- **Python: E2E Tests Only** - Debug E2E tests  
- **Python: Current Test File** - Debug currently open test file

## 🔍 Test Results & Features

### In Test Explorer:
- ✅ **Green checkmarks**: Passing tests
- ❌ **Red X marks**: Failing tests  
- ⏱️ **Clock icons**: Running tests
- 📊 **Test output**: Click on any test to see detailed output

### In Problems Panel:
- Test failures appear in Problems panel (`Ctrl+Shift+M`)
- Click to navigate directly to failing test

### Coverage Reports:
- Run "PyTest: With Coverage" task
- Open `htmlcov/index.html` in browser for detailed coverage report

## ⚡ Keyboard Shortcuts

VS Code testing shortcuts that work with your setup:

| Action | Shortcut |
|--------|----------|
| Open Test Explorer | `Ctrl+Shift+E` then click Testing |
| Run All Tests | `Ctrl+Shift+P` → "Python: Run All Tests" |
| Debug Current Test | Set cursor in test → `F5` |
| Run Current Test File | `Ctrl+Shift+P` → "Python: Run Current Test File" |
| Show Test Output | Click test in Test Explorer |

## 🛠️ Test Development Features

### Auto-Discovery:
- Tests automatically appear when you create new `test_*.py` files
- Test functions starting with `test_` are automatically discovered

### IntelliSense & Autocomplete:
- Full autocomplete for pytest fixtures
- Import suggestions for test utilities
- Error highlighting for test syntax

### Debugging:
- Set breakpoints in tests with `F9`
- Step through test execution with `F10`/`F11`
- Inspect variables in Debug Console
- View call stack and watch variables

### Test Navigation:
- `Ctrl+Click` on test names to jump to definition  
- Go to failing test directly from Problems panel
- Quick Open (`Ctrl+P`) works with test files

## 🎨 VS Code Test UI Features

### Status Bar:
- Shows running test count
- Click to open Test Explorer
- Displays test results summary

### Gutter Icons:
- Green dots next to passing tests in editor
- Red dots next to failing tests  
- Click to run individual test

### Integrated Terminal:
- Test output appears in integrated terminal
- Virtual environment automatically activated
- Full pytest command-line output

## 🔧 Troubleshooting

### Tests Not Appearing?
1. Check that Python interpreter is set to your virtual environment
   - `Ctrl+Shift+P` → "Python: Select Interpreter" 
   - Choose `./venv/Scripts/python.exe`

2. Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"

3. Manually trigger test discovery: `Ctrl+Shift+P` → "Python: Refresh Tests"

### Tests Failing in VS Code but work in terminal?
- Check that virtual environment is properly activated
- Verify `PYTHONPATH` is set correctly in launch configurations
- Ensure working directory is set to project root

### E2E Tests Not Working?
- Make sure Playwright browsers are installed: `playwright install`
- Check that live server port (5555) is not in use
- E2E tests may need headed mode for debugging: modify pytest args

## 📝 Creating New Tests

1. **Create new test file**: `test_new_feature.py` in `tests/` directory
2. **Write test function**: 
   ```python
   def test_new_functionality():
       assert True  # Your test logic here
   ```
3. **Save file** - VS Code automatically discovers new tests
4. **Run from Test Explorer** - New tests appear automatically

## 🎯 Pro Tips

1. **Use Test Explorer filters** to show only failing tests
2. **Pin Test Explorer** to keep it visible while coding  
3. **Use "Run Tests on Save"** for instant feedback (can be enabled in settings)
4. **Leverage debugging** - set breakpoints and inspect test state
5. **Use coverage reports** to identify untested code areas

Your VS Code is now fully integrated with the ManyPaintings testing system! You can run, debug, and manage all tests directly from the editor interface.