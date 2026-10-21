(() => {
    const data = [
        { id: 1, name: "Alice Nguyen", role: "Frontend Developer", department: "Engineering", status: "Active" },
        { id: 2, name: "Bob Tran", role: "Backend Developer", department: "Engineering", status: "Active" },
        { id: 3, name: "Charlie Le", role: "Product Manager", department: "Product", status: "Away" },
        { id: 4, name: "Diana Pham", role: "UX Designer", department: "Design", status: "Active" },
        { id: 5, name: "Ethan Hoang", role: "Marketing Specialist", department: "Marketing", status: "Inactive" },
        { id: 6, name: "Fiona Vu", role: "Sales Executive", department: "Sales", status: "Active" },
        { id: 7, name: "George Do", role: "DevOps Engineer", department: "Engineering", status: "Away" },
        { id: 8, name: "Hannah Bui", role: "Product Analyst", department: "Product", status: "Active" },
        { id: 9, name: "Ian Phan", role: "UI Designer", department: "Design", status: "Inactive" },
        { id: 10, name: "Julia Dang", role: "Content Strategist", department: "Marketing", status: "Active" },
        { id: 11, name: "Kevin Ly", role: "Sales Manager", department: "Sales", status: "Away" },
        { id: 12, name: "Linh Nguyen", role: "Full Stack Developer", department: "Engineering", status: "Active" },
        { id: 13, name: "Minh Tran", role: "QA Engineer", department: "Engineering", status: "Inactive" },
        { id: 14, name: "Natalie Le", role: "Product Designer", department: "Design", status: "Active" },
        { id: 15, name: "Oliver Pham", role: "Product Owner", department: "Product", status: "Away" },
        { id: 16, name: "Peter Ho", role: "Marketing Manager", department: "Marketing", status: "Active" },
        { id: 17, name: "Quinn Vu", role: "Account Executive", department: "Sales", status: "Inactive" },
        { id: 18, name: "Rachel Do", role: "Software Engineer", department: "Engineering", status: "Active" },
        { id: 19, name: "Steven Bui", role: "Data Analyst", department: "Product", status: "Away" },
        { id: 20, name: "Thao Phan", role: "Graphic Designer", department: "Design", status: "Active" },
        { id: 21, name: "Uma Dang", role: "SEO Specialist", department: "Marketing", status: "Inactive" },
        { id: 22, name: "Victor Ly", role: "Sales Representative", department: "Sales", status: "Active" },
        { id: 23, name: "Wendy Hoang", role: "Security Engineer", department: "Engineering", status: "Away" },
        { id: 24, name: "Xavier Nguyen", role: "Product Marketing Manager", department: "Marketing", status: "Active" },
        { id: 25, name: "Yuki Tran", role: "Business Analyst", department: "Product", status: "Inactive" }
    ];

    window.__DATA = Object.freeze(data);

    window.__gridState = {
        allData: window.__DATA,
        filteredData: [...window.__DATA],
        currentPage: 1,
        pageSize: 10,
        sortKey: null,
        sortDir: "asc",
        searchQuery: ""
    };
})();
