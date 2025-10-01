# 3MF Color Data Persistence Test Suite

This test suite validates the critical functionality for 3MF color data persistence in the NubArmory product management system. These tests ensure that color information from 3MF file analysis is properly saved, retrieved, and preserved through product updates.

## Test Structure

### 1. API Route Tests (`api/admin/products/update.test.ts`)
**Purpose**: Validates that the product update API correctly handles all 3MF-related fields.

**Key Test Cases**:
- ✅ All 3MF fields (`numberOfColors`, `availableColors`, `modelFile`, `modelOrientation`, etc.) are saved to database
- ✅ Type conversion works correctly (string numbers → integers/floats)
- ✅ Default values are applied for missing optional fields
- ✅ Authentication and validation work properly
- ✅ Error handling for invalid data

**Critical Assertions**:
```typescript
expect(mockPrismaUpdate).toHaveBeenCalledWith({
  data: expect.objectContaining({
    numberOfColors: 2, // Integer, not string
    availableColors: ['Red', 'Blue'], // Array preserved
    modelFile: '/models/test.stl',
    modelOrientation: { x: 0.5, y: 1.0, z: 0 }
  })
})
```

### 2. Admin Form Tests (`components/admin/EditProduct.test.tsx`)
**Purpose**: Validates that the admin form correctly handles 3MF workflow and form state.

**Key Test Cases**:
- ✅ Form initializes with existing product color data
- ✅ 3MF file upload triggers analysis and updates form state
- ✅ `numberOfColors` is auto-set based on 3MF analysis recommendations
- ✅ Form submission includes all required fields
- ✅ Color selection changes are handled correctly
- ✅ Material changes reset available colors appropriately

**Critical Workflow**:
1. Upload 3MF file → `handleModelUpload()`
2. Trigger analysis → `fetch('/api/analyze-3mf')`
3. Update form state → `setFormData({ numberOfColors: analysis.recommendations.numberOfColors })`
4. Submit form → All fields including color data sent to API

### 3. 3MF Analysis Tests (`api/analyze-3mf.test.ts`)
**Purpose**: Validates that 3MF file analysis correctly identifies color information.

**Key Test Cases**:
- ✅ Single-color 3MF files identified correctly
- ✅ Multi-color 3MF files with materials detected
- ✅ Bambu Studio paint colors handled
- ✅ File validation and error handling
- ✅ Consistent analysis output structure
- ✅ Color count recommendations capped at 4

**Critical Output Structure**:
```typescript
{
  success: true,
  analysis: {
    materials: [...],
    colorZones: number,
    hasMaterials: boolean,
    hasColors: boolean
  },
  recommendations: {
    numberOfColors: number, // Used by form
    reason: string
  }
}
```

### 4. Integration Tests (`integration/3mf-color-persistence.test.ts`)
**Purpose**: Validates the complete end-to-end workflow.

**Key Test Cases**:
- ✅ Complete workflow: Upload → Analysis → Form Update → Save → Retrieve
- ✅ Color data persists through subsequent non-3MF updates
- ✅ Edge cases (zero colors, null values, type conversion)
- ✅ Data integrity validation

**Critical Workflow Validation**:
1. **3MF Upload**: File analysis provides `numberOfColors: 2`
2. **Form Update**: User selects colors matching analysis
3. **Product Save**: All color data saved to database
4. **Data Retrieval**: Color data correctly loaded in subsequent views
5. **Future Updates**: Color data preserved when updating other fields

## Running the Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
# API route tests only
npm test api/admin/products

# Component tests only
npm test components/admin

# Integration tests only
npm test integration

# 3MF analysis tests only
npm test api/analyze-3mf
```

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode for Development
```bash
npm run test:watch
```

## Critical Test Scenarios

### 🎯 **Scenario 1: New 3MF Upload**
**What it tests**: First-time 3MF upload with color analysis
```
1. User uploads sword.3mf with 2 color zones
2. Analysis recommends numberOfColors: 2
3. User selects colors: ['Red', 'Black']
4. Product saved with all 3MF data
5. Verify: numberOfColors=2, availableColors=['Red','Black']
```

### 🎯 **Scenario 2: Subsequent Update**
**What it tests**: Color data persistence after non-3MF updates
```
1. Product has existing 3MF data: numberOfColors=3, colors=['A','B','C']
2. User updates description and price only
3. Product saved with updated description/price
4. Verify: numberOfColors=3, availableColors=['A','B','C'] still intact
```

### 🎯 **Scenario 3: Edge Cases**
**What it tests**: Data validation and type handling
```
1. numberOfColors sent as string "2" → saved as integer 2
2. numberOfColors=0 → defaults to 1
3. availableColors=null → defaults to []
4. Complex modelOrientation preserved exactly
```

## Test Data Validation

### Field Requirements Verified:
- ✅ `numberOfColors`: Integer, minimum 1, maximum 4
- ✅ `availableColors`: Array of strings, can be empty
- ✅ `modelFile`: String path to .stl/.3mf file, nullable
- ✅ `modelOrientation`: Object with x,y,z rotation values
- ✅ `finish`: String, defaults to 'Standard'
- ✅ `customizable`: Boolean, defaults to false
- ✅ `features`: Array of strings, defaults to []

### Database Persistence Verified:
- ✅ All fields saved in correct data types
- ✅ JSON fields (orientation, colors, features) properly serialized
- ✅ Updates preserve existing data when not modified
- ✅ Null/undefined values handled gracefully

## Monitoring for Regressions

### Key Indicators of Regression:
1. **Test Failure**: Any test in this suite fails
2. **API Response Changes**: Product update API missing fields
3. **Form State Issues**: 3MF analysis not updating numberOfColors
4. **Database Schema Changes**: Fields renamed or removed
5. **Type Conversion Errors**: String numbers not converted to integers

### Regular Validation:
- Run test suite before any deployment
- Test manually with actual 3MF files periodically
- Verify admin form behavior when 3MF analysis completes
- Check database entries after product updates

## Test Maintenance

### When to Update Tests:
- ✅ New 3MF-related fields added to product model
- ✅ 3MF analysis logic changes (new color detection methods)
- ✅ API route signature changes
- ✅ Form handling changes (new validation, state management)
- ✅ Database schema modifications

### Test File Locations:
```
__tests__/
├── api/
│   ├── admin/products/update.test.ts      # API validation
│   └── analyze-3mf.test.ts                # 3MF analysis
├── components/
│   └── admin/EditProduct.test.tsx         # Form behavior
├── integration/
│   └── 3mf-color-persistence.test.ts      # End-to-end
└── README.md                              # This documentation
```

## Troubleshooting Test Failures

### Common Issues:

**"numberOfColors saved as string instead of integer"**
- Check API route type conversion: `parseInt(numberOfColors) || 1`
- Verify form sends number, not string

**"availableColors not preserved"**
- Check API route includes `availableColors` in destructuring
- Verify database update includes the field

**"3MF analysis not triggering form update"**
- Check `handleModelUpload` calls analysis for .3mf files
- Verify analysis response updates `numberOfColors` in form state

**"Form submission missing fields"**
- Check `handleSubmit` sends all form data fields
- Verify API route expects and processes all fields

This test suite provides comprehensive coverage of the 3MF color data persistence functionality and should catch any regressions that could break this critical feature.