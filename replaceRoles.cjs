const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\ASHIQUE\\Desktop\\Acculead\\saas\\Hotel_Department_effiency_analizer\\production\\Hotel_Department_effiency_analizer_Frontend\\src';

const roleMap = {
    // Exact quotes for literal string arrays and roles
    "'saas_admin'": "'saas_superAdmin'",
    '"saas_admin"': '"saas_superAdmin"',
    "'owner'": "'hotel_owner'",
    '"owner"': '"hotel_owner"',
    "'gm'": "'hotel_gm'",
    '"gm"': '"hotel_gm"',
    "'supervisor'": "'hotel_supervisor'",
    '"supervisor"': '"hotel_supervisor"',
    "'dept_head'": "'hotel_dept_supervisor'",
    '"dept_head"': '"hotel_dept_supervisor"',
    "'staff'": "'hotel_dept_staff'",
    '"staff"': '"hotel_dept_staff"',
    // Also property keys
    'owner:': 'hotel_owner:',
    'gm:': 'hotel_gm:',
    'supervisor:': 'hotel_supervisor:',
    'dept_head:': 'hotel_dept_supervisor:',
    'staff:': 'hotel_dept_staff:'
};

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    for (const [oldRole, newRole] of Object.entries(roleMap)) {
        // Without '\b' this time, just globally search and replace the exact string since it includes quotes or colons
        let regexStr = oldRole.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const regex = new RegExp(regexStr, 'g');
        content = content.replace(regex, newRole);
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Modified:', file);
        changedFiles++;
    }
});

console.log(`Updated ${changedFiles} files with new roles.`);
