import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Full Stack Developer</h4>
                <h5>Globify Software Solutions</h5>
              </div>
              <h3>2024-2026</h3>
            </div>
            <p>
              Architected scalable, real-time enterprise platforms using Node.js, Express 5, and Django. Established PCI-compliant payment gateways, containerized services with Docker/AWS, and provisioned infrastructure using Terraform.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Full Stack Intern</h4>
                <h5>MashupStack</h5>
              </div>
              <h3>2023-2024</h3>
            </div>
            <p>
              Crafted responsive React frontends and Django REST Framework backends for live production workflows. Enhanced PostgreSQL/MySQL schemas, reducing API response latency by 40%.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>B.Tech in Computer Science</h4>
                <h5>University College of Engineering Kariavattom</h5>
              </div>
              <h3>2019-2023</h3>
            </div>
            <p>
              Completed Bachelor of Technology in Computer Science and Engineering, laying a strong foundation in software development, data structures, algorithms, and system design.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
