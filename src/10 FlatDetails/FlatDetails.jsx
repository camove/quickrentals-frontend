import React, { useContext, useEffect, useState } from "react";
import styles from "./FlatDetails.module.css";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const FlatDetails = () => {
  const { id } = useParams();
  const { userId, loggedIn, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [flat, setFlat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch flat details
  useEffect(() => {
  const fetchFlatDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3000/flats/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const flatData = data.data || data;
        console.log('🔍 Flat data loaded:', flatData);
        setFlat(flatData);
      } else {
        // Check pentru 404 specific
        if (response.status === 404 || response.status === 500) {
          // Flat not found - redirect to 404 page
          navigate('/404');
          return; // opreste executia
        } else {
          // Other errors - show toast and stay/go home
          toast.error("Failed to load flat details");
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Error fetching flat:', error);
      // Network errors - raman la home (nu 404)
      toast.error("Network error");
      navigate('/home');
    }
  };

  if (id && token) {
    fetchFlatDetails();
  }
}, [id, token, navigate]);

  // Fetch messages for this apartment
  const fetchMessages = async () => {
    try {
      // console.log('Fetching messages for flat:', id);
      // console.log('Current user ID:', userId);
      // console.log('Flat ownerId:', flat?.ownerId?._id);
      
      const flatOwnerId = flat?.ownerId?._id || flat?.ownerId;
      // console.log('Is owner?', flatOwnerId === userId);
      
      let messagesUrl;
      if (flat && flatOwnerId === userId) {
        // User is owner - get all messages
        messagesUrl = `http://localhost:3000/flats/${id}/messages/`;
      } else {
        // User is guest - get only their messages
        messagesUrl = `http://localhost:3000/flats/${id}/messages/${userId}`;
      }

      const response = await fetch(messagesUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const messagesData = data.data || data;
        
        if (Array.isArray(messagesData)) {
          // Sort messages by date (newest first)
          messagesData.sort((a, b) => {
            const aTime = parseInt(a.createdAt);
            const bTime = parseInt(b.createdAt);
            return bTime - aTime;
          });
          setMessages(messagesData);
        } else {
          setMessages([]);
        }
      } else if (response.status === 404) {
        setMessages([]);
      } else {
        console.error('Failed to fetch messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  useEffect(() => {
    // Fetch messages only after flat data is loaded
    if (id && token && flat) {
      fetchMessages();
    }
  }, [id, token, flat, userId]);

  // Send new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/flats/${id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent.trim()
        })
      });

      if (response.ok) {
        toast.success("Message sent successfully");
        setMessageContent("");
        fetchMessages(); // Refresh messages list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to send message");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  const formatDateTime = (dateString) => {
    try {
      if (!dateString) return 'Just now';
      
      const timestamp = typeof dateString === 'string' ? parseInt(dateString) : dateString;
      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  // Image navigation functions
  const nextImage = () => {
    if (flat && flat.flatImages) {
      setCurrentImageIndex((prev) => 
        (prev + 1) % flat.flatImages.length
      );
    }
  };

  const prevImage = () => {
    if (flat && flat.flatImages) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? flat.flatImages.length - 1 : prev - 1
      );
    }
  };

  if (!flat) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
        <div className={styles.loadingText}>
          Loading apartment details...
        </div>
      </div>
    );
  }

  const flatOwnerId = flat.ownerId?._id || flat.ownerId;
  const isOwner = flatOwnerId === userId;

  return (
    <div className={styles.container}>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: 'white',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: 'white',
            },
          },
        }}
      />
      
      {/* Header */}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/home')}
        >
          ← Back to Search
        </button>
        <h1 className={styles.title}>Apartment Details</h1>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Image Gallery */}
        <div className={styles.imageGallery}>
          <div className={styles.mainImageContainer}>
            {flat.flatImages && flat.flatImages.length > 1 && (
              <>
                <button className={styles.imageNavButton} onClick={prevImage}>
                  ‹
                </button>
                <button className={styles.imageNavButton} onClick={nextImage}>
                  ›
                </button>
              </>
            )}
            
            <img
              src={`http://localhost:3000${flat.flatImages?.[currentImageIndex] || '/uploads/default.jpg'}`}
              alt={`${flat.city} apartment`}
              className={styles.mainImage}
              onError={(e) => {
                e.target.src = 'http://localhost:3000/uploads/default.jpg';
              }}
            />
            
            {flat.flatImages && flat.flatImages.length > 1 && (
              <div className={styles.imageDots}>
                {flat.flatImages.map((_, index) => (
                  <span
                    key={index}
                    className={`${styles.dot} ${index === currentImageIndex ? styles.activeDot : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}

            {/* Badges */}
            <div className={styles.badges}>
              {flat.hasAc && (
                <span className={styles.badge}>❄️ AC</span>
              )}
            </div>
          </div>
        </div>

        {/* Apartment Information */}
        <div className={styles.apartmentInfo}>
          <div className={styles.locationHeader}>
            <h2 className={styles.cityTitle}>{flat.city}</h2>
            <p className={styles.address}>
              {flat.streetName} {flat.streetNumber}
            </p>
          </div>

          <div className={styles.priceSection}>
            <div className={styles.price}>€{flat.rentPrice}/month</div>
            <div className={styles.area}>{flat.areaSize} m²</div>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailCard}>
              <h3>Property Details</h3>
              <div className={styles.detailItem}>
                <strong>Year Built:</strong>
                <span>{flat.yearBuilt}</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Air Conditioning:</strong>
                <span>{flat.hasAc ? "Yes" : "No"}</span>
              </div>
              <div className={styles.detailItem}>
                <strong>Available From:</strong>
                <span>{new Date(flat.dateAvailable).toLocaleDateString()}</span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <h3>Contact Information</h3>
              <div className={styles.detailItem}>
                <strong>Owner:</strong>
                <span>
                  {flat.ownerId?.firstName && flat.ownerId?.lastName 
                    ? `${flat.ownerId.firstName} ${flat.ownerId.lastName}`
                    : 'Property Owner'
                  }
                </span>
              </div>
              {!isOwner && flat.ownerId?.email && (
                <div className={styles.detailItem}>
                  <strong>Email:</strong>
                  <span>{flat.ownerId.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Section */}
          <div className={styles.actionSection}>
            {isOwner ? (
              <div className={styles.ownerActions}>
                <button 
                  className={styles.editButton}
                  onClick={() => navigate(`/edit-flat/${flat._id}`)}
                >
                  Edit Apartment Details
                </button>
                <p className={styles.ownerNote}>
                  This is your apartment. You can view all messages below.
                </p>
              </div>
            ) : (
              <div className={styles.guestActions}>
                <form className={styles.messageForm} onSubmit={handleSendMessage}>
                  <h3>Send a message to the owner</h3>
                  <textarea
                    className={styles.textarea}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message here (max 200 characters)"
                    maxLength={200}
                    required
                  />
                  <div className={styles.characterCount}>
                    {messageContent.length}/200 characters
                  </div>
                  <button type="submit" className={styles.sendButton}>
                    Send Message
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Section */}
      <div className={styles.messagesSection}>
        <h2 className={styles.messagesTitle}>
          {isOwner ? `All Messages (${messages.length})` : `Your Messages (${messages.length})`}
        </h2>
        
        {messages.length === 0 ? (
          <div className={styles.noMessages}>
            {isOwner ? "No messages yet." : "You haven't sent any messages yet."}
          </div>
        ) : (
          <div className={styles.messagesContainer}>
            <div className={styles.messagesList}>
              {messages.map((message) => (
                <div key={message._id} className={styles.messageItem}>
                  <div className={styles.messageHeader}>
                    <div className={styles.messageAuthor}>
                      <strong>
                        {isOwner 
                          ? (message.userId?.firstName && message.userId?.lastName
                              ? `${message.userId.firstName} ${message.userId.lastName}`
                              : 'Guest User'
                            )
                          : 'You'
                        }
                      </strong>
                      {isOwner && message.userId?.email && (
                        <span className={styles.messageEmail}>
                          ({message.userId.email})
                        </span>
                      )}
                    </div>
                    <div className={styles.messageDate}>
                      {message.createdAt ? formatDateTime(message.createdAt) : 'Just now'}
                    </div>
                  </div>
                  <div className={styles.messageContent}>
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlatDetails;